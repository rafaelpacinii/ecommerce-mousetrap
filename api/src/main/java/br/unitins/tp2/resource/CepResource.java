package br.unitins.tp2.resource;

import br.unitins.tp2.service.CepService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/ceps")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class CepResource {
    @Inject CepService service;

    @GET
    @Path("/{cep}")
    public Response consultar(@PathParam("cep") String cep) {
        return Response.ok(service.consultar(cep)).build();
    }
}
