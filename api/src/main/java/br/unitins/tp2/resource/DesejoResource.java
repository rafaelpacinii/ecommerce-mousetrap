package br.unitins.tp2.resource;
import br.unitins.tp2.service.DesejoService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.*;
@Path("/desejos") @Produces(MediaType.APPLICATION_JSON) @RolesAllowed({"customer","admin"})
public class DesejoResource {
    @Inject DesejoService service;
    @GET public Response listar(@QueryParam("page") @DefaultValue("0") int page,@QueryParam("pageSize") @DefaultValue("12") int size){return Response.ok(service.listar(page,size)).build();}
    @GET @Path("/ids") public Response ids(){return Response.ok(service.ids()).build();}
    @PUT @Path("/{id}") public Response adicionar(@PathParam("id") Long id){service.adicionar(id);return Response.noContent().build();}
    @DELETE @Path("/{id}") public Response remover(@PathParam("id") Long id){service.remover(id);return Response.noContent().build();}
}
