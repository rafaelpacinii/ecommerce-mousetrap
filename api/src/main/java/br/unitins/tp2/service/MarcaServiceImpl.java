package br.unitins.tp2.service;

import java.util.List;
import br.unitins.tp2.dto.MarcaDTO;
import br.unitins.tp2.dto.MarcaResponseDTO;
import br.unitins.tp2.exception.ValidationException;
import br.unitins.tp2.model.Marca;
import br.unitins.tp2.repository.MarcaRepository;
import br.unitins.tp2.repository.MouseRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotFoundException;

@ApplicationScoped
public class MarcaServiceImpl implements MarcaService {
    @Inject MarcaRepository repository;
    @Inject MouseRepository mouseRepository;

    @Override
    public List<Marca> findAll(int page, int pageSize) {
        return repository.findAll().page(page, pageSize).list();
    }

    @Override
    public List<Marca> findByNome(String nome, int page, int pageSize) {
        return repository.findByNome(nome).page(page, pageSize).list();
    }

    @Override
    public long count() {
        return repository.findAll().count();
    }

    @Override
    public long count(String nome) {
        return repository.findByNome(nome).count();
    }

    @Override
    public MarcaResponseDTO findById(Long id) {
        return MarcaResponseDTO.valueOf(buscar(id));
    }

    @Override
    @Transactional
    public MarcaResponseDTO create(MarcaDTO dto) {
        validarNome(dto.nome(), null);
        Marca marca = new Marca();
        marca.setNome(dto.nome());
        marca.setAtivo(dto.ativo());
        repository.persistAndFlush(marca);
        return MarcaResponseDTO.valueOf(marca);
    }

    @Override
    @Transactional
    public MarcaResponseDTO update(Long id, MarcaDTO dto) {
        Marca marca = buscar(id);
        validarNome(dto.nome(), id);
        marca.setNome(dto.nome());
        marca.setAtivo(dto.ativo());
        repository.flush();
        return MarcaResponseDTO.valueOf(marca);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Marca marca = buscar(id);
        if (mouseRepository.existePorMarca(id)) {
            throw new ValidationException("marca", "A marca possui mouses vinculados. Remova os vínculos ou desative a marca.");
        }
        repository.delete(marca);
        repository.flush();
    }

    private Marca buscar(Long id) {
        Marca marca = repository.findById(id);
        if (marca == null) throw new NotFoundException("Marca não encontrada.");
        return marca;
    }

    private void validarNome(String nome, Long id) {
        Marca existente = repository.findByNomeExato(nome);
        if (existente != null && !existente.getId().equals(id)) {
            throw new ValidationException("nome", "Já existe uma marca com esse nome.");
        }
    }
}
