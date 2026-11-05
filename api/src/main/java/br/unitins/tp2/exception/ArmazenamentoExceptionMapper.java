package br.unitins.tp2.exception;

import java.util.List;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

@Provider
public class ArmazenamentoExceptionMapper implements ExceptionMapper<ArmazenamentoException> {
    @Context UriInfo uri;

    @Override
    public Response toResponse(ArmazenamentoException exception) {
        return Problem.response(503, "Service Unavailable", exception.getMessage(), uri.getPath(), List.of());
    }
}
