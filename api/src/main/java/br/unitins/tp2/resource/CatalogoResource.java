package br.unitins.tp2.resource;

import java.math.BigDecimal;
import java.util.List;
import br.unitins.tp2.dto.*;
import br.unitins.tp2.service.CatalogoService;
import jakarta.inject.Inject;
import jakarta.annotation.security.PermitAll;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

@Path("/catalogo")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@PermitAll
public class CatalogoResource {
    @Inject CatalogoService service;

    @GET
    @Path("/mouses")
    public PageResponse<ProdutoResponseDTO> consultar(
            @QueryParam("nome") String nome, @QueryParam("marca") List<Long> marcas,
            @QueryParam("sensor") String sensor, @QueryParam("conexao") List<Integer> conexoes,
            @QueryParam("pegada") List<Integer> pegadas, @QueryParam("pollingRateMin") Integer pollingRateMin,
            @QueryParam("tipoSwitch") Integer tipoSwitch, @QueryParam("pesoMax") BigDecimal pesoMax,
            @QueryParam("precoMin") BigDecimal precoMin, @QueryParam("precoMax") BigDecimal precoMax,
            @QueryParam("emEstoque") @DefaultValue("false") boolean emEstoque,
            @QueryParam("ordenar") @DefaultValue("nome") String ordenar,
            @QueryParam("page") @DefaultValue("0") int page, @QueryParam("pageSize") @DefaultValue("12") int pageSize) {
        return service.consultar(new CatalogoFiltroDTO(nome, marcas, sensor, conexoes, pegadas, pollingRateMin,
                tipoSwitch, pesoMax, precoMin, precoMax, emEstoque, ordenar, page, pageSize));
    }

    @GET @Path("/mouses/{id}")
    public ProdutoResponseDTO findById(@PathParam("id") Long id) { return service.findById(id); }

    @GET @Path("/filtros")
    public CatalogoFacetasResponseDTO facetas() { return service.facetas(); }
}
