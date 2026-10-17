package br.unitins.tp2.dto;
import br.unitins.tp2.model.Pedido;
public record PedidoAdminResponseDTO(PedidoResponseDTO pedido,Long idCliente,String cliente,String email){
    public static PedidoAdminResponseDTO valueOf(Pedido p){return new PedidoAdminResponseDTO(PedidoResponseDTO.valueOf(p),p.getCliente().getId(),p.getCliente().getNome(),p.getCliente().getEmail());}
}
