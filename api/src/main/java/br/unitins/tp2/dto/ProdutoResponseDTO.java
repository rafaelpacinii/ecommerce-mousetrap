package br.unitins.tp2.dto;

import java.math.BigDecimal;
import java.util.List;
import br.unitins.tp2.model.*;

public record ProdutoResponseDTO(Long id, String sku, String nome, String descricao, String cor,
        BigDecimal preco, Integer quantidadeEstoque, Integer dpiMaximo, Integer quantidadeBotoes,
        BigDecimal pesoGramas, MarcaResponseDTO marca, List<TipoConexao> tiposConexao,
        EspecificacoesMouseResponseDTO especificacoes, List<ImagemMouseResponseDTO> imagens) {
    public static ProdutoResponseDTO valueOf(Mouse mouse) {
        var dto = MouseResponseDTO.valueOf(mouse);
        return new ProdutoResponseDTO(dto.id(), dto.sku(), dto.nome(), dto.descricao(), dto.cor(), dto.preco(),
                dto.quantidadeEstoque(), dto.dpiMaximo(), dto.quantidadeBotoes(), dto.pesoGramas(), dto.marca(),
                dto.tiposConexao(), dto.especificacoes(), dto.imagens());
    }
}
