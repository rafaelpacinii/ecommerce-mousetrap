package br.unitins.tp2.dto;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import br.unitins.tp2.model.*;
public record PedidoResponseDTO(Long id, UUID chaveCheckout, StatusPedido status, Instant criadoEm, Instant expiraEm,
        EnderecoEntregaResponseDTO endereco, List<ItemPedidoResponseDTO> itens, BigDecimal subtotal,
        BigDecimal frete, Integer prazoDiasUteis, BigDecimal total, List<PagamentoResponseDTO> pagamentos) {
    public static PedidoResponseDTO valueOf(Pedido p) {
        return new PedidoResponseDTO(p.getId(), p.getChaveCheckout(), p.getStatus(), p.getCriadoEm(), p.getExpiraEm(),
            EnderecoEntregaResponseDTO.valueOf(p.getEndereco()), p.getItens().stream().map(ItemPedidoResponseDTO::valueOf).toList(),
            p.getSubtotal(), p.getFrete(), p.getPrazoDiasUteis(), p.getTotal(),
            p.getPagamentos().stream().map(PagamentoResponseDTO::valueOf).toList());
    }
}
