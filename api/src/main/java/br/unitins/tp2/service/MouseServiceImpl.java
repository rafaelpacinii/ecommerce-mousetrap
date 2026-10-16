package br.unitins.tp2.service;

import java.util.List;
import java.util.stream.Collectors;
import br.unitins.tp2.dto.MouseDTO;
import br.unitins.tp2.dto.MouseResponseDTO;
import br.unitins.tp2.exception.ValidationException;
import br.unitins.tp2.model.Marca;
import br.unitins.tp2.model.Mouse;
import br.unitins.tp2.model.TipoConexao;
import br.unitins.tp2.repository.MarcaRepository;
import br.unitins.tp2.repository.MouseRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.OptimisticLockException;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotFoundException;

@ApplicationScoped
public class MouseServiceImpl implements MouseService {
    @Inject MouseRepository repository;
    @Inject MarcaRepository marcaRepository;

    @Override
    public List<Mouse> findAll(int page, int pageSize) {
        return repository.findAll().page(page, pageSize).list();
    }

    @Override
    public List<Mouse> findByNome(String nome, int page, int pageSize) {
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
    public MouseResponseDTO findById(Long id) {
        return MouseResponseDTO.valueOf(buscar(id));
    }

    @Override
    @Transactional
    public MouseResponseDTO create(MouseDTO dto) {
        Mouse mouse = new Mouse();
        preencher(mouse, dto);
        repository.persistAndFlush(mouse);
        return MouseResponseDTO.valueOf(mouse);
    }

    @Override
    @Transactional
    public MouseResponseDTO update(Long id, MouseDTO dto) {
        Mouse mouse = buscar(id);
        if (dto.versao() == null || !dto.versao().equals(mouse.getVersao())) {
            throw new OptimisticLockException("O mouse foi alterado. Recarregue o cadastro antes de salvar.");
        }
        preencher(mouse, dto);
        repository.flush();
        return MouseResponseDTO.valueOf(mouse);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        repository.delete(buscar(id));
        repository.flush();
    }

    private Mouse buscar(Long id) {
        Mouse mouse = repository.findById(id);
        if (mouse == null) throw new NotFoundException("Mouse não encontrado.");
        return mouse;
    }

    private void preencher(Mouse mouse, MouseDTO dto) {
        Mouse existente = repository.findBySku(dto.sku());
        if (existente != null && !existente.getId().equals(mouse.getId())) {
            throw new ValidationException("sku", "Já existe um mouse com esse SKU.");
        }
        Marca marca = marcaRepository.findById(dto.idMarca());
        if (marca == null) throw new ValidationException("idMarca", "A marca selecionada não existe.");
        mouse.setMarca(marca);
        mouse.setSku(dto.sku());
        mouse.setNome(dto.nome());
        mouse.setDescricao(dto.descricao());
        mouse.setCor(dto.cor());
        mouse.setPreco(dto.preco());
        mouse.setQuantidadeEstoque(dto.quantidadeEstoque());
        mouse.setDpiMaximo(dto.dpiMaximo());
        mouse.setQuantidadeBotoes(dto.quantidadeBotoes());
        mouse.setPesoGramas(dto.pesoGramas());
        mouse.setAtivo(dto.ativo());
        mouse.getTiposConexao().clear();
        mouse.getTiposConexao().addAll(dto.tiposConexao().stream()
                .map(TipoConexao::valueOf).collect(Collectors.toSet()));
    }
}
