package br.unitins.tp2.resource;
import br.unitins.tp2.dto.*;
import br.unitins.tp2.service.PedidoService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.*;
@Path("/pedidos")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RolesAllowed({"customer", "admin"})
public class PedidoResource {
    @Inject PedidoService service;
    @GET @Path("/configuracao") public Response configuracao() { return Response.ok(service.configuracao()).build(); }
    @POST @Path("/revisao") public Response revisar(@NotNull @Valid RevisaoPedidoDTO dto) { return Response.ok(service.revisar(dto)).build(); }
    @POST public Response criar(@NotNull @Valid PedidoDTO dto) {
        var pedido = service.criar(dto);
        return Response.created(java.net.URI.create("/pedidos/" + pedido.id())).entity(pedido).build();
    }
    @GET @Path("/{id}") public Response findById(@PathParam("id") Long id) { return Response.ok(service.findById(id)).build(); }
    @POST @Path("/{id}/pagamentos") public Response pagar(@PathParam("id") Long id, @NotNull @Valid PagamentoDTO dto) { return Response.ok(service.pagar(id, dto)).build(); }
    @POST @Path("/{id}/pagamentos/{pagamentoId}/simular") @RolesAllowed("admin")
    public Response simular(@PathParam("id") Long id, @PathParam("pagamentoId") Long pagamentoId, @NotNull @Valid SimulacaoPagamentoDTO dto) {
        return Response.ok(service.simular(id, pagamentoId, dto)).build();
    }
    @POST @Path("/{id}/cancelamento") @Consumes(MediaType.WILDCARD) public Response cancelar(@PathParam("id") Long id) { return Response.ok(service.cancelar(id)).build(); }
}
