package br.unitins.tp2.dto;
import java.math.BigDecimal;
import java.util.List;
public record RevisaoPedidoResponseDTO(EnderecoEntregaResponseDTO endereco, List<ItemPedidoResponseDTO> itens,
        BigDecimal subtotal, FreteResponseDTO frete, BigDecimal total) {}
