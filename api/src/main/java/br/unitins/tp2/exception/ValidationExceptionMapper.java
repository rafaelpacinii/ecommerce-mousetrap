package br.unitins.tp2.exception;

import java.util.List;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

@Provider
public class ValidationExceptionMapper implements ExceptionMapper<ValidationException> {
    @Context UriInfo uri;

    @Override
    public Response toResponse(ValidationException exception) {
        return Problem.response(400, "Dados inválidos", exception.getMessage(), uri.getPath(),
                List.of(new Problem.FieldError(exception.getField(), exception.getMessage())));
    }
}
