package br.unitins.tp2.exception;

import java.util.List;
import org.hibernate.exception.ConstraintViolationException;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

@Provider
public class DatabaseConstraintExceptionMapper implements ExceptionMapper<ConstraintViolationException> {
    @Context UriInfo uri;

    @Override
    public Response toResponse(ConstraintViolationException exception) {
        return Problem.response(409, "Conflito de dados", "Não foi possível salvar ou excluir: existe um registro duplicado ou vinculado.", uri.getPath(), List.of());
    }
}
