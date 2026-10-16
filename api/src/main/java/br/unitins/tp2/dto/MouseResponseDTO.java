package br.unitins.tp2.dto;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import br.unitins.tp2.model.Mouse;
import br.unitins.tp2.model.TipoConexao;

public record MouseResponseDTO(
        Long id, String sku, String nome, String descricao, String cor, BigDecimal preco,
        Integer quantidadeEstoque, Integer dpiMaximo, Integer quantidadeBotoes, BigDecimal pesoGramas,
        Boolean ativo, Long versao, MarcaResponseDTO marca, List<TipoConexao> tiposConexao) {
    public static MouseResponseDTO valueOf(Mouse mouse) {
        return new MouseResponseDTO(mouse.getId(), mouse.getSku(), mouse.getNome(), mouse.getDescricao(),
                mouse.getCor(), mouse.getPreco(), mouse.getQuantidadeEstoque(), mouse.getDpiMaximo(),
                mouse.getQuantidadeBotoes(), mouse.getPesoGramas(), mouse.getAtivo(), mouse.getVersao(),
                MarcaResponseDTO.valueOf(mouse.getMarca()),
                mouse.getTiposConexao().stream().sorted(Comparator.comparing(TipoConexao::getId)).toList());
    }
}
