package br.unitins.tp2.exception;

import java.util.List;
import jakarta.ws.rs.core.Response;

public record Problem(String type, String title, int status, String detail, String instance,
        List<FieldError> errors) {
    public record FieldError(String field, String message) {}

    public static Response response(int status, String title, String detail, String instance,
            List<FieldError> errors) {
        return Response.status(status).type("application/problem+json")
                .entity(new Problem("about:blank", title, status, detail, instance, errors)).build();
    }
}
