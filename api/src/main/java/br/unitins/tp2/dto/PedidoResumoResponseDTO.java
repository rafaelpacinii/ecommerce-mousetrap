package br.unitins.tp2.dto;
import java.time.Instant;
import java.math.BigDecimal;
import br.unitins.tp2.model.*;
public record PedidoResumoResponseDTO(Long id,String cliente,String email,Instant criadoEm,StatusPedido status,BigDecimal total) {
    public static PedidoResumoResponseDTO valueOf(Pedido p){return new PedidoResumoResponseDTO(p.getId(),p.getCliente().getNome(),p.getCliente().getEmail(),p.getCriadoEm(),p.getStatus(),p.getTotal());}
}
