package br.unitins.tp2.service;

import java.util.Arrays;
import br.unitins.tp2.dto.*;
import br.unitins.tp2.model.*;
import br.unitins.tp2.exception.ValidationException;
import br.unitins.tp2.repository.CatalogoRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotFoundException;

@ApplicationScoped
public class CatalogoServiceImpl implements CatalogoService {
    @Inject CatalogoRepository repository;

    @Override
    @Transactional
    public PageResponse<ProdutoResponseDTO> consultar(CatalogoFiltroDTO f) {
        if (f.page() < 0 || f.pageSize() < 1 || f.pageSize() > 100)
            throw new ValidationException("page", "Informe uma página válida e um tamanho entre 1 e 100.");
        if (!CatalogoRepository.ordenacaoValida(f.ordenar())) throw new ValidationException("ordenar", "Ordenação inválida.");
        if (f.nome() != null && f.nome().length() > 150 || f.sensor() != null && f.sensor().length() > 100)
            throw new ValidationException("nome", "Filtro muito longo.");
        if (f.marcas() != null && (f.marcas().size() > 100 || f.marcas().stream().anyMatch(id -> id == null || id < 1)))
            throw new ValidationException("marca", "Marca inválida.");
        if (f.conexoes() != null && (f.conexoes().size() > 3 || f.conexoes().stream().anyMatch(id -> id == null || id < 1 || id > 3)))
            throw new ValidationException("conexao", "Conexão inválida.");
        if (f.pegadas() != null && (f.pegadas().size() > 3 || f.pegadas().stream().anyMatch(id -> id == null || id < 1 || id > 3)))
            throw new ValidationException("pegada", "Pegada inválida.");
        if (f.tipoSwitch() != null && (f.tipoSwitch() < 1 || f.tipoSwitch() > 2)) throw new ValidationException("tipoSwitch", "Switch inválido.");
        if (f.pollingRateMin() != null && (f.pollingRateMin() < 125 || f.pollingRateMin() > 8000)) throw new ValidationException("pollingRateMin", "Taxa inválida.");
        if (f.pesoMax() != null && f.pesoMax().signum() <= 0) throw new ValidationException("pesoMax", "O peso deve ser positivo.");
        if (f.precoMin() != null && f.precoMin().signum() < 0 || f.precoMax() != null && f.precoMax().signum() < 0)
            throw new ValidationException("preco", "O preço não pode ser negativo.");
        if (f.precoMin() != null && f.precoMax() != null && f.precoMin().compareTo(f.precoMax()) > 0)
            throw new ValidationException("precoMax", "O preço máximo deve ser maior ou igual ao mínimo.");
        var consulta = repository.consultar(f);
        long total = consulta.count();
        return PageResponse.of(consulta.page(f.page(), f.pageSize()).list(), f.page(), f.pageSize(), total, ProdutoResponseDTO::valueOf);
    }

    @Override
    @Transactional
    public ProdutoResponseDTO findById(Long id) {
        Mouse mouse = repository.buscarPublico(id);
        if (mouse == null) throw new NotFoundException("Produto não encontrado.");
        return ProdutoResponseDTO.valueOf(mouse);
    }

    @Override
    @Transactional
    public CatalogoFacetasResponseDTO facetas() {
        return new CatalogoFacetasResponseDTO(repository.marcasPublicas().stream().map(MarcaResponseDTO::valueOf).toList(),
                repository.sensoresPublicos(), repository.pollingRatesPublicos(), Arrays.asList(TipoConexao.values()),
                Arrays.asList(Pegada.values()), Arrays.asList(TipoSwitch.values()));
    }
}
