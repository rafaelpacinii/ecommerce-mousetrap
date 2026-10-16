package br.unitins.tp2.exception;

import java.util.List;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

@Provider
public class WebApplicationExceptionMapper implements ExceptionMapper<WebApplicationException> {
    @Context UriInfo uri;

    @Override
    public Response toResponse(WebApplicationException exception) {
        int status = exception.getResponse().getStatus();
        String detail = status == 404 ? "Registro ou rota não encontrado." : "Não foi possível processar a requisição.";
        return Problem.response(status, exception.getResponse().getStatusInfo().getReasonPhrase(),
                detail, uri.getPath(), List.of());
    }
}
