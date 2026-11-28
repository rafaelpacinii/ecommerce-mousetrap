package br.unitins.tp2.exception;

import java.util.List;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import org.eclipse.microprofile.config.inject.ConfigProperty;

@Provider
public class AutenticacaoExceptionMapper implements ExceptionMapper<AutenticacaoException> {
    @Context
    UriInfo uri;

    @ConfigProperty(name = "auth.cookie.secure", defaultValue = "false")
    boolean cookieSecure;

    @Override
    public Response toResponse(AutenticacaoException exception) {
        Response base = Problem.response(
                exception.status(),
                exception.title(),
                exception.getMessage(),
                uri.getPath(),
                List.of());
        if ((exception.status() == 401 || exception.status() == 403)
                && uri.getPath() != null
                && uri.getPath().startsWith("/auth")) {
            String clearCookie = "mousetrap_refresh=; Path=/auth; Max-Age=0; HttpOnly; SameSite=Lax"
                    + (cookieSecure ? "; Secure" : "");
            return Response.fromResponse(base).header(HttpHeaders.SET_COOKIE, clearCookie).build();
        }
        return base;
    }
}
