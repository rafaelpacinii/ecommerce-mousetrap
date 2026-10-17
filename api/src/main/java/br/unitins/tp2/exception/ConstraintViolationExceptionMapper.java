package br.unitins.tp2.exception;

import jakarta.validation.ConstraintViolationException;
import jakarta.validation.ElementKind;
import jakarta.validation.Path;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

@Provider
public class ConstraintViolationExceptionMapper implements ExceptionMapper<ConstraintViolationException> {
    @Context UriInfo uri;

    @Override
    public Response toResponse(ConstraintViolationException exception) {
        var errors = exception.getConstraintViolations().stream()
                .map(v -> new Problem.FieldError(campo(v.getPropertyPath()), v.getMessage()))
                .sorted(java.util.Comparator.comparing(Problem.FieldError::field))
                .toList();
        return Problem.response(400, "Dados inválidos", "Confira os campos informados.", uri.getPath(), errors);
    }

    private String campo(Path path) {
        String field = "dados";
        for (Path.Node node : path) {
            if (node.getKind() == ElementKind.PROPERTY) field = node.getName();
        }
        return field;
    }
}
