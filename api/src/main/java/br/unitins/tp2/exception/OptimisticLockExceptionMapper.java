package br.unitins.tp2.exception;

import java.util.List;
import jakarta.persistence.OptimisticLockException;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

@Provider
public class OptimisticLockExceptionMapper implements ExceptionMapper<OptimisticLockException> {
    @Context UriInfo uri;

    @Override
    public Response toResponse(OptimisticLockException exception) {
        return Problem.response(409, "Cadastro alterado", "O cadastro foi alterado por outra operação. Recarregue a página antes de salvar.", uri.getPath(), List.of());
    }
}
