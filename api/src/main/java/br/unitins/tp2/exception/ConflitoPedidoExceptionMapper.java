package br.unitins.tp2.exception;
import java.util.List;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
import jakarta.ws.rs.ext.*;
@Provider
public class ConflitoPedidoExceptionMapper implements ExceptionMapper<ConflitoPedidoException> {
    @Context UriInfo uri;
    public Response toResponse(ConflitoPedidoException e) {
        return Problem.response(409, "Revise o pedido", e.getMessage(), uri.getPath(), List.of());
    }
}
