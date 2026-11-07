package br.unitins.tp2.resource;

import java.util.List;
import br.unitins.tp2.dto.EstadoResponseDTO;
import br.unitins.tp2.dto.MunicipioResponseDTO;
import br.unitins.tp2.service.LocalidadeService;
import jakarta.annotation.security.PermitAll;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/localidades")
@Produces(MediaType.APPLICATION_JSON)
@PermitAll
public class LocalidadeResource {
    @Inject LocalidadeService service;

    @GET @Path("/estados")
    public List<EstadoResponseDTO> estados() {
        return service.estados();
    }

    @GET @Path("/estados/{uf}/municipios")
    public List<MunicipioResponseDTO> municipios(@PathParam("uf") String uf) {
        return service.municipios(uf);
    }
}
