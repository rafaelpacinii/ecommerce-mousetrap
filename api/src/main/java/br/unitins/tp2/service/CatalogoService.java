package br.unitins.tp2.service;

import br.unitins.tp2.dto.*;

public interface CatalogoService {
    PageResponse<ProdutoResponseDTO> consultar(CatalogoFiltroDTO filtro);
    ProdutoResponseDTO findById(Long id);
    CatalogoFacetasResponseDTO facetas();
}
