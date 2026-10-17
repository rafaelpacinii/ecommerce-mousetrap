package br.unitins.tp2.resource;

import br.unitins.tp2.service.ClienteService;
import br.unitins.tp2.dto.ClienteDTO;
import br.unitins.tp2.dto.EnderecoDTO;
import br.unitins.tp2.dto.PerfilClienteDTO;
import br.unitins.tp2.dto.VinculoClienteDTO;
import jakarta.inject.Inject;
import jakarta.annotation.security.RolesAllowed;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/clientes")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RolesAllowed("admin")
public class ClienteResource {
    @Inject ClienteService service;

    @GET
    @Path("/me")
    @RolesAllowed({"customer", "admin"})
    public Response findMe() {
        return Response.ok(service.findMe()).build();
    }

    @PUT
    @Path("/me")
    @RolesAllowed({"customer", "admin"})
    public Response saveMe(@NotNull @Valid PerfilClienteDTO dto) {
        return Response.ok(service.saveMe(dto)).build();
    }

    @GET
    @Path("/me/enderecos")
    @RolesAllowed({"customer", "admin"})
    public Response listarMeusEnderecos() {
        return Response.ok(service.listarMeusEnderecos()).build();
    }

    @POST
    @Path("/me/enderecos")
    @RolesAllowed({"customer", "admin"})
    public Response criarMeuEndereco(@NotNull @Valid EnderecoDTO dto) {
        return Response.status(Response.Status.CREATED).entity(service.criarMeuEndereco(dto)).build();
    }

    @PUT
    @Path("/me/enderecos/{id}")
    @RolesAllowed({"customer", "admin"})
    public Response atualizarMeuEndereco(@PathParam("id") Long id, @NotNull @Valid EnderecoDTO dto) {
        return Response.ok(service.atualizarMeuEndereco(id, dto)).build();
    }

    @PUT
    @Path("/me/enderecos/{id}/principal")
    @RolesAllowed({"customer", "admin"})
    public Response definirMeuEnderecoPrincipal(@PathParam("id") Long id) {
        return Response.ok(service.definirMeuEnderecoPrincipal(id)).build();
    }

    @DELETE
    @Path("/me/enderecos/{id}")
    @RolesAllowed({"customer", "admin"})
    public Response removerMeuEndereco(@PathParam("id") Long id) {
        service.removerMeuEndereco(id);
        return Response.noContent().build();
    }

    @GET
    public Response findAll() {
        return Response.ok(service.findAll()).build();
    }

    @GET
    @Path("/{id}")
    public Response findById(@PathParam("id") Long id) {
        return Response.ok(service.findById(id)).build();
    }

    @POST
    public Response create(@NotNull @Valid ClienteDTO dto) {
        return Response.status(Response.Status.CREATED).entity(service.create(dto)).build();
    }

    @PUT
    @Path("/{id}/identidade")
    @RolesAllowed("admin")
    public Response vincularIdentidade(@PathParam("id") Long id, @NotNull @Valid VinculoClienteDTO dto) {
        return Response.ok(service.vincularIdentidade(id, dto)).build();
    }

    @PUT
    @Path("/{id}")
    public Response update(@PathParam("id") Long id, @NotNull @Valid ClienteDTO dto) {
        return Response.ok(service.update(id, dto)).build();
    }

    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("id") Long id) {
        service.delete(id);
        return Response.noContent().build();
    }
}
