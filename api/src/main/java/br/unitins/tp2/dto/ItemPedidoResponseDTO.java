package br.unitins.tp2.dto;
import java.math.BigDecimal;
import br.unitins.tp2.model.ItemPedido;
public record ItemPedidoResponseDTO(Long idMouse, String sku, String nome, String marca, String cor,
        Integer quantidade, BigDecimal precoUnitario, BigDecimal subtotal) {
    public static ItemPedidoResponseDTO valueOf(ItemPedido i) {
        return new ItemPedidoResponseDTO(i.getMouse().getId(), i.getSku(), i.getNome(), i.getMarca(), i.getCor(),
            i.getQuantidade(), i.getPrecoUnitario(), i.getSubtotal());
    }
}
