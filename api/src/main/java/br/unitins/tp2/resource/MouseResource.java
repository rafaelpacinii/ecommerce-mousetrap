package br.unitins.tp2.resource;

import br.unitins.tp2.dto.MouseDTO;
import br.unitins.tp2.dto.MouseResponseDTO;
import br.unitins.tp2.dto.PageResponse;
import br.unitins.tp2.service.MouseService;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/mouses")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class MouseResource {
    @Inject
    MouseService service;

    @GET
    public PageResponse<MouseResponseDTO> findAll(
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("pageSize") @DefaultValue("10") int pageSize) {
        validarPagina(page, pageSize);
        return PageResponse.of(service.findAll(page, pageSize), page, pageSize, service.count(), MouseResponseDTO::valueOf);
    }

    @GET
    @Path("/nome/{nome}")
    public PageResponse<MouseResponseDTO> findByNome(
            @PathParam("nome") String nome,
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("pageSize") @DefaultValue("10") int pageSize) {
        validarPagina(page, pageSize);
        String termo = nome == null ? "" : nome.strip();
        return PageResponse.of(service.findByNome(termo, page, pageSize), page, pageSize,
                service.count(termo), MouseResponseDTO::valueOf);
    }

    @GET
    @Path("/{id}")
    public Response findById(@PathParam("id") Long id) {
        return Response.ok(service.findById(id)).build();
    }

    @POST
    public Response create(@NotNull @Valid MouseDTO dto) {
        return Response.status(Response.Status.CREATED).entity(service.create(dto)).build();
    }

    @PUT
    @Path("/{id}")
    public Response update(@PathParam("id") Long id, @NotNull @Valid MouseDTO dto) {
        return Response.ok(service.update(id, dto)).build();
    }

    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("id") Long id) {
        service.delete(id);
        return Response.noContent().build();
    }

    private void validarPagina(int page, int pageSize) {
        if (page < 0 || pageSize < 1 || pageSize > 100) {
            throw new BadRequestException("page deve ser >= 0 e pageSize deve estar entre 1 e 100.");
        }
    }
}
