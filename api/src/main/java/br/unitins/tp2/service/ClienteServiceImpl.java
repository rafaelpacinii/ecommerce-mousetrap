package br.unitins.tp2.service;

import java.util.List;
import br.unitins.tp2.dto.CepResponseDTO;
import br.unitins.tp2.dto.ClienteDTO;
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
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.ServiceUnavailableException;

@ApplicationScoped
public class ClienteServiceImpl implements ClienteService {
    @Inject ClienteRepository repository;
    @Inject MunicipioRepository municipios;
    @Inject EstadoRepository estados;
    @Inject CepService cepService;

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
