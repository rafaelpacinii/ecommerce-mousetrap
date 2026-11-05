package br.unitins.tp2.service;

import java.util.List;
import br.unitins.tp2.dto.MarcaDTO;
import br.unitins.tp2.dto.MarcaResponseDTO;
import br.unitins.tp2.exception.ValidationException;
import br.unitins.tp2.model.Marca;
import br.unitins.tp2.model.Pais;
import br.unitins.tp2.repository.MarcaRepository;
import br.unitins.tp2.repository.MouseRepository;
import br.unitins.tp2.repository.PaisRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.annotation.security.RolesAllowed;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotFoundException;

@ApplicationScoped
@RolesAllowed("admin")
public class MarcaServiceImpl implements MarcaService {
    @Inject MarcaRepository repository;
    @Inject MouseRepository mouseRepository;
    @Inject PaisRepository paisRepository;

    @Override public br.unitins.tp2.dto.PageResponse<MarcaResponseDTO> pesquisar(String busca,String ordenar,int page,int size){
        if(page<0||size<1||size>100)throw new jakarta.ws.rs.BadRequestException("Paginação inválida.");
        String termo=busca==null?"":busca.strip();if(termo.length()>150)throw new jakarta.ws.rs.BadRequestException("Busca muito longa.");
        String ordem=switch(ordenar==null?"nome":ordenar){case "nome"->"nome";case "nome-desc"->"nome desc";case "ativo"->"ativo";case "ativo-desc"->"ativo desc";default->throw new jakarta.ws.rs.BadRequestException("Ordenação inválida.");};
        var q=repository.find("lower(nome) like ?1 order by "+ordem+",id asc","%"+termo.toLowerCase(java.util.Locale.ROOT)+"%");
        long total=q.count();return br.unitins.tp2.dto.PageResponse.of(q.page(page,size).list(),page,size,total,MarcaResponseDTO::valueOf);
    }
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
        marca.setLogomarcaUrl(dto.logomarcaUrl() == null || dto.logomarcaUrl().isBlank() ? null : dto.logomarcaUrl());
        aplicarAtributosComplementares(marca, dto, true);
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
        // Legacy clients omit this field; an empty string explicitly removes the logo.
        if (dto.logomarcaUrl() != null) marca.setLogomarcaUrl(dto.logomarcaUrl().isBlank() ? null : dto.logomarcaUrl());
        aplicarAtributosComplementares(marca, dto, false);
        repository.flush();
        return MarcaResponseDTO.valueOf(marca);
    }

    private void aplicarAtributosComplementares(Marca marca, MarcaDTO dto, boolean criacao) {
        if (dto.siglaPaisOrigem() != null) {
            if (dto.siglaPaisOrigem().isBlank()) {
                marca.setPaisOrigem(null);
            } else {
                Pais pais = paisRepository.findBySiglaIso(dto.siglaPaisOrigem());
                if (pais == null) {
                    throw new ValidationException("siglaPaisOrigem", "País de origem não encontrado para a sigla informada.");
                }
                marca.setPaisOrigem(pais);
            }
        }
        if (dto.descricao() != null) {
            marca.setDescricao(dto.descricao().isBlank() ? null : dto.descricao());
        }
        if (dto.siteOficial() != null) {
            marca.setSiteOficial(dto.siteOficial().isBlank() ? null : dto.siteOficial());
        }
        if (dto.emailSuporte() != null) {
            marca.setEmailSuporte(dto.emailSuporte().isBlank() ? null : dto.emailSuporte());
        }
        if (dto.anoFundacao() != null) {
            marca.setAnoFundacao(dto.anoFundacao());
        }
        if (dto.garantiaPadraoMeses() != null) {
            marca.setGarantiaPadraoMeses(dto.garantiaPadraoMeses());
        } else if (criacao && marca.getGarantiaPadraoMeses() == null) {
            marca.setGarantiaPadraoMeses(12);
        }
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
