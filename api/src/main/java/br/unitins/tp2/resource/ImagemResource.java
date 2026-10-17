package br.unitins.tp2.resource;

import br.unitins.tp2.service.ImagemStorageService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.resteasy.reactive.RestForm;
import org.jboss.resteasy.reactive.multipart.FileUpload;

@Path("/imagens")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.MULTIPART_FORM_DATA)
@RolesAllowed("admin")
public class ImagemResource {
    @Inject ImagemStorageService service;

    @POST
    @Path("/{destino}")
    public Response enviar(@PathParam("destino") String destino, @RestForm("arquivo") FileUpload arquivo) {
        return Response.status(Response.Status.CREATED).entity(service.enviar(destino,
                arquivo == null ? null : arquivo.uploadedFile(), arquivo == null ? null : arquivo.contentType())).build();
    }
}
