package br.unitins.tp2.service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import br.unitins.tp2.dto.CadastroContaDTO;
import br.unitins.tp2.dto.CepResponseDTO;
import br.unitins.tp2.dto.LoginDTO;
import br.unitins.tp2.dto.SessaoAuthResponseDTO;
import br.unitins.tp2.dto.UsuarioAutenticadoDTO;
import br.unitins.tp2.exception.AutenticacaoException;
import br.unitins.tp2.exception.ValidationException;
import br.unitins.tp2.model.Cliente;
import br.unitins.tp2.model.Endereco;
import br.unitins.tp2.model.Estado;
import br.unitins.tp2.model.Municipio;
import br.unitins.tp2.model.TelefoneCliente;
import br.unitins.tp2.model.TipoTelefone;
import br.unitins.tp2.repository.ClienteRepository;
import br.unitins.tp2.repository.EnderecoRepository;
import br.unitins.tp2.repository.EstadoRepository;
import br.unitins.tp2.repository.MunicipioRepository;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.annotation.security.RolesAllowed;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.ServiceUnavailableException;
import org.eclipse.microprofile.jwt.JsonWebToken;

@ApplicationScoped
public class AuthServiceImpl implements AuthService {
    private static final Set<String> PAPEIS_LOJA = Set.of("admin", "customer");

    @Inject
    KeycloakIdentityClient identityClient;

    @Inject
    ClienteRepository clientes;

    @Inject
    EnderecoRepository enderecos;

    @Inject
    MunicipioRepository municipios;

    @Inject
    EstadoRepository estados;

    @Inject
    CepService cepService;

    @Inject
    ObjectMapper mapper;

    @Inject
    JsonWebToken token;

    @Inject
    SecurityIdentity identity;

    @Override
    public ResultadoSessao login(LoginDTO dto) {
        KeycloakIdentityClient.TokenSet tokens = identityClient.autenticar(dto.email(), dto.senha());
        return construirSessao(tokens);
    }

    @Override
    public ResultadoSessao cadastrar(CadastroContaDTO dto) {
        if (clientes.findByEmail(dto.email()) != null) {
            throw new AutenticacaoException(
                    409,
                    "Conta já existente",
                    "Já existe um cadastro associado a este e-mail. Entre na sua conta ou solicite vinculação à administração.");
        }
        Municipio municipio = validarDadosEnderecoOpcional(dto);
        String userId = identityClient.criarUsuarioCliente(dto.nome(), dto.email(), dto.senha());
        try {
            QuarkusTransaction.requiringNew().run(() -> persistirClienteVinculado(userId, dto, municipio));
        } catch (RuntimeException erro) {
            identityClient.removerUsuario(userId);
            throw erro;
        }
        KeycloakIdentityClient.TokenSet tokens = identityClient.autenticar(dto.email(), dto.senha());
        return construirSessao(tokens);
    }

    @Override
    public ResultadoSessao renovar(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new AutenticacaoException(
                    401, "Não autenticado", "Sua sessão não está ativa. Entre na sua conta para continuar.");
        }
        KeycloakIdentityClient.TokenSet tokens = identityClient.renovar(refreshToken);
        return construirSessao(tokens);
    }

    @Override
    @RolesAllowed({ "customer", "admin" })
    public UsuarioAutenticadoDTO usuarioAtual() {
        String subject = token.getSubject();
        if (subject == null || subject.isBlank() || subject.length() > 255) {
            throw new ForbiddenException();
        }
        List<String> roles = identity.getRoles().stream()
                .filter(PAPEIS_LOJA::contains)
                .sorted()
                .toList();
        if (roles.isEmpty()) {
            throw new ForbiddenException();
        }
        Cliente cliente = clientes.findByIdentidadeSubject(subject);
        if (cliente != null && Boolean.FALSE.equals(cliente.getAtivo())) {
            throw new AutenticacaoException(403, "Conta desativada", "Esta conta está desativada.");
        }
        String emailClaim = token.getClaim("email");
        String nomeClaim = token.getClaim("name");
        if (nomeClaim == null || nomeClaim.isBlank()) {
            nomeClaim = token.getClaim("preferred_username");
        }
        String email = cliente != null ? cliente.getEmail() : (emailClaim == null ? "" : emailClaim.strip().toLowerCase(Locale.ROOT));
        String nome = cliente != null ? cliente.getNome() : (nomeClaim == null ? "" : nomeClaim.strip());
        boolean perfilCompleto = cliente != null && cliente.getMunicipio() != null;
        return new UsuarioAutenticadoDTO(subject, nome, email, roles, perfilCompleto);
    }

    @Override
    public void logout(String refreshToken) {
        identityClient.encerrarSessao(refreshToken);
    }

    private ResultadoSessao construirSessao(KeycloakIdentityClient.TokenSet tokens) {
        ClaimsExtraidos claims = extrairClaims(tokens.accessToken());
        if (claims.roles().isEmpty()) {
            identityClient.encerrarSessao(tokens.refreshToken());
            throw new AutenticacaoException(
                    403,
                    "Acesso restrito",
                    "Sua conta não possui perfil de acesso habilitado para utilizar a loja.");
        }
        Cliente cliente = QuarkusTransaction.requiringNew()
                .call(() -> clientes.findByIdentidadeSubject(claims.subject()));
        if (cliente != null && Boolean.FALSE.equals(cliente.getAtivo())) {
            identityClient.encerrarSessao(tokens.refreshToken());
            throw new AutenticacaoException(
                    403, "Conta desativada", "Esta conta foi desativada pela administração.");
        }
        String nome = cliente != null && cliente.getNome() != null && !cliente.getNome().isBlank()
                ? cliente.getNome()
                : claims.nome();
        String email = cliente != null && cliente.getEmail() != null && !cliente.getEmail().isBlank()
                ? cliente.getEmail()
                : claims.email();
        boolean perfilCompleto = cliente != null && cliente.getMunicipio() != null;
        UsuarioAutenticadoDTO usuario = new UsuarioAutenticadoDTO(
                claims.subject(), nome, email, claims.roles(), perfilCompleto);
        return new ResultadoSessao(
                new SessaoAuthResponseDTO(tokens.accessToken(), tokens.expiresIn(), usuario),
                tokens.refreshToken(),
                tokens.refreshExpiresIn());
    }

    private Municipio validarDadosEnderecoOpcional(CadastroContaDTO dto) {
        if (!dto.possuiDadosEndereco()) {
            return null;
        }
        if (vazio(dto.cep())) {
            throw new ValidationException("cep", "Informe o CEP do endereço.");
        }
        if (vazio(dto.logradouro())) {
            throw new ValidationException("logradouro", "Informe o logradouro do endereço.");
        }
        if (vazio(dto.bairro())) {
            throw new ValidationException("bairro", "Informe o bairro do endereço.");
        }
        if (vazio(dto.numero())) {
            throw new ValidationException("numero", "Informe o número ou S/N.");
        }
        if (!vazio(dto.codigoIbge())) {
            Municipio municipio = municipios.findByCodigoIbge(dto.codigoIbge());
            if (municipio == null) {
                throw new ValidationException("codigoIbge", "Selecione um município cadastrado.");
            }
            return municipio;
        }
        CepResponseDTO cep = cepService.consultar(dto.cep());
        Estado estado = estados.findBySigla(cep.uf());
        if (estado == null) {
            throw new ServiceUnavailableException();
        }
        municipios.inserirSeAusente(cep.localidade(), cep.ibge(), estado.getId());
        Municipio municipio = municipios.findByCodigoIbge(cep.ibge());
        if (!municipio.getEstado().getId().equals(estado.getId())) {
            throw new ValidationException("cep", "Município incompatível com o estado do CEP.");
        }
        return municipio;
    }

    private void persistirClienteVinculado(String subject, CadastroContaDTO dto, Municipio municipio) {
        if (clientes.findByEmail(dto.email()) != null) {
            throw new AutenticacaoException(
                    409,
                    "Conta já existente",
                    "Já existe um cadastro associado a este e-mail.");
        }
        Cliente cliente = new Cliente();
        cliente.setIdentidadeSubject(subject);
        cliente.setNome(dto.nome());
        cliente.setEmail(dto.email());
        cliente.setAtivo(true);

        if (!vazio(dto.telefone())) {
            String ddd = dto.telefone().substring(0, 2);
            String numeroTel = dto.telefone().substring(2);
            TelefoneCliente tel = new TelefoneCliente();
            tel.setCliente(cliente);
            tel.setDdd(ddd);
            tel.setNumero(numeroTel);
            tel.setTipoTelefone(numeroTel.length() == 9 ? TipoTelefone.CELULAR : TipoTelefone.RESIDENCIAL);
            tel.setPrincipal(true);
            cliente.getTelefones().add(tel);
        }

        if (municipio != null) {
            Municipio gerenciado = municipios.findById(municipio.getId());
            cliente.setCep(dto.cep());
            cliente.setLogradouro(dto.logradouro());
            cliente.setBairro(dto.bairro());
            cliente.setNumero(dto.numero());
            cliente.setComplemento(dto.complemento());
            cliente.setMunicipio(gerenciado);
        }

        clientes.persistAndFlush(cliente);

        if (municipio != null) {
            Endereco principal = new Endereco();
            principal.setCliente(cliente);
            principal.setApelido("Principal");
            principal.setDestinatario(cliente.getNome());
            principal.setCep(cliente.getCep());
            principal.setLogradouro(cliente.getLogradouro());
            principal.setBairro(cliente.getBairro());
            principal.setNumero(cliente.getNumero());
            principal.setComplemento(cliente.getComplemento());
            principal.setMunicipio(cliente.getMunicipio());
            principal.setPrincipal(true);
            enderecos.persistAndFlush(principal);
        }
    }

    private ClaimsExtraidos extrairClaims(String jwt) {
        String[] partes = jwt == null ? new String[0] : jwt.split("\\.");
        if (partes.length < 2) {
            throw new AutenticacaoException(
                    503, "Resposta inválida", "O provedor de identidade retornou um token inválido.");
        }
        try {
            byte[] decoded = Base64.getUrlDecoder().decode(partes[1]);
            JsonNode payload = mapper.readTree(new String(decoded, StandardCharsets.UTF_8));
            String sub = payload.path("sub").asText("").strip();
            if (sub.isEmpty() || sub.length() > 255) {
                throw new AutenticacaoException(
                        503, "Resposta inválida", "Identificador de usuário ausente no token de acesso.");
            }
            String email = payload.path("email").asText("").strip().toLowerCase(Locale.ROOT);
            String nome = payload.path("name").asText("").strip();
            if (nome.isEmpty()) {
                nome = payload.path("preferred_username").asText("").strip();
            }
            List<String> roles = new ArrayList<>();
            JsonNode realmRoles = payload.path("realm_access").path("roles");
            if (realmRoles.isArray()) {
                for (JsonNode role : realmRoles) {
                    String valor = role.asText("");
                    if (PAPEIS_LOJA.contains(valor) && !roles.contains(valor)) {
                        roles.add(valor);
                    }
                }
            }
            roles.sort(String::compareTo);
            return new ClaimsExtraidos(sub, nome, email, List.copyOf(roles));
        } catch (IllegalArgumentException | IOException erro) {
            throw new AutenticacaoException(
                    503, "Resposta inválida", "Não foi possível validar os dados da sessão.");
        }
    }

    private static boolean vazio(String valor) {
        return valor == null || valor.isBlank();
    }

    private record ClaimsExtraidos(String subject, String nome, String email, List<String> roles) {
    }
}
