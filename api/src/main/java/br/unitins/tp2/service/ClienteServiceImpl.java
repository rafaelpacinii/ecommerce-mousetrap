package br.unitins.tp2.service;

import java.util.List;
import br.unitins.tp2.dto.CepResponseDTO;
import br.unitins.tp2.dto.ClienteDTO;
import br.unitins.tp2.dto.PerfilClienteDTO;
import br.unitins.tp2.dto.VinculoClienteDTO;
import br.unitins.tp2.dto.ClienteResponseDTO;
import br.unitins.tp2.dto.EnderecoDTO;
import br.unitins.tp2.dto.EnderecoResponseDTO;
import br.unitins.tp2.model.Cliente;
import br.unitins.tp2.model.Endereco;
import br.unitins.tp2.model.Estado;
import br.unitins.tp2.model.Municipio;
import br.unitins.tp2.repository.ClienteRepository;
import br.unitins.tp2.repository.EnderecoRepository;
import br.unitins.tp2.repository.EstadoRepository;
import br.unitins.tp2.repository.MunicipioRepository;
import br.unitins.tp2.exception.ValidationException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.annotation.security.RolesAllowed;
import jakarta.transaction.Transactional;
import jakarta.persistence.LockModeType;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.ForbiddenException;
import org.eclipse.microprofile.jwt.JsonWebToken;
import jakarta.ws.rs.ServiceUnavailableException;

@ApplicationScoped
@RolesAllowed("admin")
public class ClienteServiceImpl implements ClienteService {
    @Inject
    ClienteRepository repository;
    @Inject br.unitins.tp2.repository.PedidoRepository pedidos;
    @Inject
    EnderecoRepository enderecos;
    @Inject
    MunicipioRepository municipios;
    @Inject
    EstadoRepository estados;
    @Inject
    CepService cepService;
    @Inject
    JsonWebToken token;

    @Override
    @RolesAllowed({ "customer", "admin" })
    public ClienteResponseDTO findMe() {
        Cliente cliente = repository.findByIdentidadeSubject(subject());
        if (cliente == null)
            throw new NotFoundException();
        return ClienteResponseDTO.valueOf(cliente);
    }

    @Override
    @Transactional
    @RolesAllowed({ "customer", "admin" })
    public ClienteResponseDTO saveMe(PerfilClienteDTO dto) {
        String subject = subject();
        Object verified = token.getClaim("email_verified");
        String email = token.getClaim("email");
        if (!Boolean.TRUE.equals(verified) || email == null || email.isBlank()) {
            throw new ForbiddenException("Confirme seu e-mail antes de salvar o perfil.");
        }
        Cliente cliente = repository.findByIdentidadeSubject(subject);
        boolean novo = cliente == null;
        if (novo) {
            if (repository.findByEmail(dto.comEmail(email).email()) != null) {
                throw new ValidationException("perfil",
                        "Seu cadastro já existe e precisa ser vinculado à sua conta pela administração. "
                        + "Solicite a vinculação antes de salvar seus dados e endereços.");
            }
            cliente = new Cliente();
            cliente.setIdentidadeSubject(subject);
        }
        preencher(cliente, dto.comEmail(email));
        if (novo)
            repository.persist(cliente);
        repository.flush();
        sincronizarEnderecoPrincipal(cliente);
        return ClienteResponseDTO.valueOf(cliente);
    }

    @Override
    @Transactional
    @RolesAllowed("admin")
    public ClienteResponseDTO vincularIdentidade(Long id, VinculoClienteDTO dto) {
        Cliente cliente = repository.findById(id, LockModeType.PESSIMISTIC_WRITE);
        if (cliente == null)
            throw new NotFoundException();
        if (!cliente.getEmail().equals(dto.email())) {
            throw new ValidationException("email", "O e-mail confirmado deve corresponder ao cadastro do cliente.");
        }
        if (cliente.getIdentidadeSubject() != null && !cliente.getIdentidadeSubject().equals(dto.identidadeSubject())) {
            throw new ValidationException("identidadeSubject", "Este cliente já está vinculado a outra conta.");
        }
        Cliente vinculado = repository.findByIdentidadeSubject(dto.identidadeSubject());
        if (vinculado != null && !vinculado.getId().equals(cliente.getId())) {
            throw new ValidationException("identidadeSubject", "Esta conta já está vinculada a outro cliente.");
        }
        cliente.setIdentidadeSubject(dto.identidadeSubject());
        repository.flush();
        return ClienteResponseDTO.valueOf(cliente);
    }

    @Override
    @Transactional
    @RolesAllowed({ "customer", "admin" })
    public List<EnderecoResponseDTO> listarMeusEnderecos() {
        Cliente cliente = repository.findByIdentidadeSubject(subject());
        if (cliente == null)
            return List.of();
        List<Endereco> lista = enderecos.findByClienteId(cliente.getId());
        if (lista.isEmpty()) {
            sincronizarEnderecoPrincipal(cliente);
            lista = enderecos.findByClienteId(cliente.getId());
        }
        return lista.stream().map(EnderecoResponseDTO::valueOf).toList();
    }

    @Override
    @Transactional
    @RolesAllowed({ "customer", "admin" })
    public EnderecoResponseDTO criarMeuEndereco(EnderecoDTO dto) {
        Cliente cliente = buscarMeuClienteObrigatorio();
        Municipio municipio = resolverMunicipioPorCep(dto.cep());
        List<Endereco> existentes = enderecos.findByClienteId(cliente.getId());
        boolean tornarPrincipal = Boolean.TRUE.equals(dto.principal()) || existentes.isEmpty();
        if (tornarPrincipal) {
            enderecos.desmarcarPrincipais(cliente.getId());
            enderecos.flush();
        }
        Endereco endereco = new Endereco();
        endereco.setCliente(cliente);
        preencherCamposEndereco(endereco, cliente, dto, municipio, tornarPrincipal);
        enderecos.persistAndFlush(endereco);
        if (tornarPrincipal) {
            aplicarEnderecoPrincipalNoCliente(cliente, endereco);
            repository.flush();
        }
        return EnderecoResponseDTO.valueOf(endereco);
    }

    @Override
    @Transactional
    @RolesAllowed({ "customer", "admin" })
    public EnderecoResponseDTO atualizarMeuEndereco(Long id, EnderecoDTO dto) {
        Cliente cliente = buscarMeuCliente();
        Endereco endereco = enderecos.findByIdAndClienteId(id, cliente.getId());
        if (endereco == null)
            throw new NotFoundException();
        Municipio municipio = resolverMunicipioPorCep(dto.cep());
        boolean tornarPrincipal = endereco.isPrincipal() || Boolean.TRUE.equals(dto.principal());
        if (tornarPrincipal && !endereco.isPrincipal()) {
            enderecos.desmarcarPrincipais(cliente.getId());
            enderecos.flush();
        }
        preencherCamposEndereco(endereco, cliente, dto, municipio, tornarPrincipal);
        enderecos.flush();
        if (endereco.isPrincipal()) {
            aplicarEnderecoPrincipalNoCliente(cliente, endereco);
            repository.flush();
        }
        return EnderecoResponseDTO.valueOf(endereco);
    }

    @Override
    @Transactional
    @RolesAllowed({ "customer", "admin" })
    public EnderecoResponseDTO definirMeuEnderecoPrincipal(Long id) {
        Cliente cliente = buscarMeuCliente();
        Endereco endereco = enderecos.findByIdAndClienteId(id, cliente.getId());
        if (endereco == null)
            throw new NotFoundException();
        if (!endereco.isPrincipal()) {
            enderecos.desmarcarPrincipais(cliente.getId());
            enderecos.flush();
            endereco.setPrincipal(true);
            enderecos.flush();
        }
        aplicarEnderecoPrincipalNoCliente(cliente, endereco);
        repository.flush();
        return EnderecoResponseDTO.valueOf(endereco);
    }

    @Override
    @Transactional
    @RolesAllowed({ "customer", "admin" })
    public void removerMeuEndereco(Long id) {
        Cliente cliente = buscarMeuCliente();
        Endereco endereco = enderecos.findByIdAndClienteId(id, cliente.getId());
        if (endereco == null)
            throw new NotFoundException();
        List<Endereco> todos = enderecos.findByClienteId(cliente.getId());
        if (todos.size() <= 1) {
            throw new ValidationException("endereco", "Mantenha pelo menos um endereço de entrega cadastrado.");
        }
        boolean eraPrincipal = endereco.isPrincipal();
        enderecos.delete(endereco);
        enderecos.flush();
        if (eraPrincipal) {
            Endereco substituto = enderecos.findByClienteId(cliente.getId()).get(0);
            substituto.setPrincipal(true);
            enderecos.flush();
            aplicarEnderecoPrincipalNoCliente(cliente, substituto);
            repository.flush();
        }
    }

    private Cliente buscarMeuCliente() {
        Cliente cliente = repository.findByIdentidadeSubject(subject());
        if (cliente == null)
            throw new NotFoundException();
        return cliente;
    }

    private Cliente buscarMeuClienteObrigatorio() {
        Cliente cliente = repository.findByIdentidadeSubject(subject());
        if (cliente == null) {
            throw new ValidationException("perfil", "Salve seus dados pessoais antes de cadastrar endereços.");
        }
        return cliente;
    }

    private String subject() {
        String subject = token.getSubject();
        if (subject == null || subject.isBlank() || subject.length() > 255) {
            throw new ForbiddenException();
        }
        return subject;
    }

    @Override
    public List<ClienteResponseDTO> findAll() {
        return repository.listAll().stream().map(ClienteResponseDTO::valueOf).toList();
    }

    @Override public br.unitins.tp2.dto.PageResponse<ClienteResponseDTO> pesquisar(String busca,String ordenar,int page,int size){
        if(page<0||size<1||size>100)throw new jakarta.ws.rs.BadRequestException("Paginação inválida.");
        String termo=busca==null?"":busca.strip();if(termo.length()>150)throw new jakarta.ws.rs.BadRequestException("Busca muito longa.");
        String ordem=switch(ordenar==null?"nome":ordenar){case "nome"->"nome asc,id asc";case "nome-desc"->"nome desc,id asc";case "email"->"email asc,id asc";case "email-desc"->"email desc,id asc";default->throw new jakarta.ws.rs.BadRequestException("Ordenação inválida.");};
        var q=repository.find("(lower(nome) like ?1 or lower(email) like ?1) order by "+ordem,"%"+termo.toLowerCase(java.util.Locale.ROOT)+"%");
        long total=q.count();return br.unitins.tp2.dto.PageResponse.of(q.page(page,size).list(),page,size,total,ClienteResponseDTO::valueOf);
    }
    @Override
    public ClienteResponseDTO findById(Long id) {
        return ClienteResponseDTO.valueOf(buscar(id));
    }

    @Override
    @Transactional
    public ClienteResponseDTO create(ClienteDTO dto) {
        Cliente cliente = new Cliente();
        preencher(cliente, dto);
        repository.persistAndFlush(cliente);
        sincronizarEnderecoPrincipal(cliente);
        return ClienteResponseDTO.valueOf(cliente);
    }

    @Override
    @Transactional
    public ClienteResponseDTO update(Long id, ClienteDTO dto) {
        Cliente cliente = buscar(id);
        if (cliente.getIdentidadeSubject() != null && !cliente.getEmail().equals(dto.email())) {
            throw new ValidationException("email", "O e-mail desta conta deve ser alterado pelo próprio titular.");
        }
        preencher(cliente, dto);
        repository.flush();
        sincronizarEnderecoPrincipal(cliente);
        return ClienteResponseDTO.valueOf(cliente);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Cliente cliente=repository.findById(id,LockModeType.PESSIMISTIC_WRITE);
        if(cliente==null)throw new NotFoundException();
        if(pedidos.count("cliente.id",id)>0)throw new ValidationException("cliente","Este cliente possui pedidos. Seu histórico deve ser preservado.");
        repository.delete(cliente);
        repository.flush();
    }

    private Cliente buscar(Long id) {
        Cliente cliente = repository.findById(id);
        if (cliente == null)
            throw new NotFoundException();
        return cliente;
    }

    private Municipio resolverMunicipioPorCep(String cepCodigo) {
        CepResponseDTO cep = cepService.consultar(cepCodigo);
        Estado estado = estados.findBySigla(cep.uf());
        if (estado == null)
            throw new ServiceUnavailableException();
        municipios.inserirSeAusente(cep.localidade(), cep.ibge(), estado.getId());
        Municipio municipio = municipios.findByCodigoIbge(cep.ibge());
        if (!municipio.getEstado().getId().equals(estado.getId())) {
            throw new ValidationException("cep", "Município incompatível com o estado do CEP.");
        }
        return municipio;
    }

    private void preencher(Cliente cliente, ClienteDTO dto) {
        Cliente existente = repository.findByEmail(dto.email());
        if (existente != null && !existente.getId().equals(cliente.getId())) {
            throw new ValidationException("email", "Já existe um cliente com este e-mail.");
        }
        Municipio municipio = resolverMunicipioPorCep(dto.cep());
        cliente.setNome(dto.nome());
        cliente.setEmail(dto.email());
        cliente.setCep(dto.cep());
        cliente.setLogradouro(dto.logradouro());
        cliente.setBairro(dto.bairro());
        cliente.setNumero(dto.numero());
        cliente.setComplemento(dto.complemento());
        cliente.setMunicipio(municipio);
    }

    private void preencherCamposEndereco(
            Endereco endereco, Cliente cliente, EnderecoDTO dto, Municipio municipio, boolean principal) {
        endereco.setApelido(dto.apelido());
        endereco.setDestinatario(dto.destinatario() != null ? dto.destinatario() : cliente.getNome());
        endereco.setCep(dto.cep());
        endereco.setLogradouro(dto.logradouro());
        endereco.setBairro(dto.bairro());
        endereco.setNumero(dto.numero());
        endereco.setComplemento(dto.complemento());
        endereco.setMunicipio(municipio);
        endereco.setPrincipal(principal);
    }

    private void aplicarEnderecoPrincipalNoCliente(Cliente cliente, Endereco principal) {
        cliente.setCep(principal.getCep());
        cliente.setLogradouro(principal.getLogradouro());
        cliente.setBairro(principal.getBairro());
        cliente.setNumero(principal.getNumero());
        cliente.setComplemento(principal.getComplemento());
        cliente.setMunicipio(principal.getMunicipio());
    }

    private void sincronizarEnderecoPrincipal(Cliente cliente) {
        Endereco principal = enderecos.findPrincipalByClienteId(cliente.getId());
        boolean novo = principal == null;
        if (novo) {
            principal = new Endereco();
            principal.setCliente(cliente);
            principal.setApelido("Principal");
            principal.setPrincipal(true);
        }
        principal.setDestinatario(cliente.getNome());
        principal.setCep(cliente.getCep());
        principal.setLogradouro(cliente.getLogradouro());
        principal.setBairro(cliente.getBairro());
        principal.setNumero(cliente.getNumero());
        principal.setComplemento(cliente.getComplemento());
        principal.setMunicipio(cliente.getMunicipio());
        if (novo) {
            enderecos.persist(principal);
        }
        enderecos.flush();
    }
}
