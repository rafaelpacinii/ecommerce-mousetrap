package br.unitins.tp2.resource;
import br.unitins.tp2.service.PedidoService;
import br.unitins.tp2.dto.*;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.*;
@Path("/admin/pedidos") @Produces(MediaType.APPLICATION_JSON) @Consumes(MediaType.APPLICATION_JSON) @RolesAllowed("admin")
public class PedidoAdminResource {
    @Inject PedidoService service;
    @GET public Response listar(@QueryParam("busca") String busca,@QueryParam("status") Integer status,@QueryParam("ordenar") @DefaultValue("recentes") String ordenar,@QueryParam("page") @DefaultValue("0") int page,@QueryParam("pageSize") @DefaultValue("10") int size){return Response.ok(service.listarAdmin(busca,status,ordenar,page,size)).build();}
    @GET @Path("/indicadores") public Response indicadores(){return Response.ok(service.indicadores()).build();}
    @GET @Path("/{id}") public Response detalhe(@PathParam("id") Long id){return Response.ok(service.detalheAdmin(id)).build();}
    @POST @Path("/{id}/pagamentos/{pagamentoId}/decisao") public Response decidir(@PathParam("id") Long id,@PathParam("pagamentoId") Long pagamentoId,@NotNull @Valid DecisaoPagamentoDTO dto){return Response.ok(service.decidirPagamento(id,pagamentoId,dto)).build();}
    @POST @Path("/{id}/envio") public Response enviar(@PathParam("id") Long id,@NotNull @Valid EnvioPedidoDTO dto){return Response.ok(service.enviar(id,dto)).build();}
    @POST @Path("/{id}/entrega") public Response entregar(@PathParam("id") Long id,@NotNull @Valid OperacaoPedidoDTO dto){return Response.ok(service.entregar(id,dto)).build();}
    @POST @Path("/{id}/cancelamento") public Response cancelar(@PathParam("id") Long id,@NotNull @Valid OperacaoPedidoDTO dto){return Response.ok(service.cancelarAdmin(id,dto)).build();}
}
