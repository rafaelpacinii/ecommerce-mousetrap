package br.unitins.tp2.dto;
import java.time.Instant;
import br.unitins.tp2.model.*;
public record EventoPedidoResponseDTO(StatusPedido status, Instant ocorridoEm, String descricao) {
    public static EventoPedidoResponseDTO valueOf(EventoPedido e){return new EventoPedidoResponseDTO(e.getStatus(),e.getOcorridoEm(),e.getDescricao());}
}
