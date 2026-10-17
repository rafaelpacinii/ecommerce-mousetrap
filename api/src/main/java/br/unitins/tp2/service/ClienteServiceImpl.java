package br.unitins.tp2.service;

import java.util.List;
import br.unitins.tp2.dto.CepResponseDTO;
import br.unitins.tp2.dto.ClienteDTO;
import br.unitins.tp2.dto.PerfilClienteDTO;
import br.unitins.tp2.dto.ClienteResponseDTO;
import br.unitins.tp2.model.Cliente;
import br.unitins.tp2.model.Estado;
import br.unitins.tp2.model.Municipio;
import br.unitins.tp2.repository.ClienteRepository;
import br.unitins.tp2.repository.EstadoRepository;
import br.unitins.tp2.repository.MunicipioRepository;
import br.unitins.tp2.exception.ValidationException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.annotation.security.RolesAllowed;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.ForbiddenException;
import org.eclipse.microprofile.jwt.JsonWebToken;
import jakarta.ws.rs.ServiceUnavailableException;

@ApplicationScoped
@RolesAllowed("admin")
public class ClienteServiceImpl implements ClienteService {
    @Inject ClienteRepository repository;
    @Inject MunicipioRepository municipios;
    @Inject EstadoRepository estados;
    @Inject CepService cepService;
    @Inject JsonWebToken token;

    @Override
    @RolesAllowed({"customer", "admin"})
    public ClienteResponseDTO findMe() {
        Cliente cliente = repository.findByIdentidadeSubject(subject());
        if (cliente == null) throw new NotFoundException();
        return ClienteResponseDTO.valueOf(cliente);
    }

    @Override
    @Transactional
    @RolesAllowed({"customer", "admin"})
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
            cliente = new Cliente();
            cliente.setIdentidadeSubject(subject);
        }
        preencher(cliente, dto.comEmail(email));
        if (novo) repository.persist(cliente);
        repository.flush();
        return ClienteResponseDTO.valueOf(cliente);
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
        return ClienteResponseDTO.valueOf(cliente);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        repository.delete(buscar(id));
        repository.flush();
    }

    private Cliente buscar(Long id) {
        Cliente cliente = repository.findById(id);
        if (cliente == null) throw new NotFoundException();
        return cliente;
    }

    private void preencher(Cliente cliente, ClienteDTO dto) {
        Cliente existente = repository.findByEmail(dto.email());
        if (existente != null && !existente.getId().equals(cliente.getId())) {
            throw new ValidationException("email", "Já existe um cliente com este e-mail.");
        }
        CepResponseDTO cep = cepService.consultar(dto.cep());
        Estado estado = estados.findBySigla(cep.uf());
        if (estado == null) throw new ServiceUnavailableException();
        municipios.inserirSeAusente(cep.localidade(), cep.ibge(), estado.getId());
        Municipio municipio = municipios.findByCodigoIbge(cep.ibge());
        if (!municipio.getEstado().getId().equals(estado.getId())) {
            throw new ValidationException("cep", "Município incompatível com o estado do CEP.");
        }
        cliente.setNome(dto.nome());
        cliente.setEmail(dto.email());
        cliente.setCep(dto.cep());
        cliente.setLogradouro(dto.logradouro());
        cliente.setBairro(dto.bairro());
        cliente.setNumero(dto.numero());
        cliente.setComplemento(dto.complemento());
        cliente.setMunicipio(municipio);
    }
}
