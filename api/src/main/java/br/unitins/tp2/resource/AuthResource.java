package br.unitins.tp2.resource;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;
import br.unitins.tp2.dto.CadastroContaDTO;
import br.unitins.tp2.dto.LoginDTO;
import br.unitins.tp2.exception.AutenticacaoException;
import br.unitins.tp2.service.AuthService;
import jakarta.annotation.security.PermitAll;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.CookieParam;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.config.inject.ConfigProperty;

@Path("/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AuthResource {
    public static final String COOKIE_REFRESH = "mousetrap_refresh";

    @Inject
    AuthService service;

    @ConfigProperty(name = "auth.cookie.secure", defaultValue = "false")
    boolean cookieSecure;

    @ConfigProperty(name = "quarkus.http.cors.origins", defaultValue = "http://localhost:4200")
    String origensPermitidas;

    @POST
    @Path("/login")
    @PermitAll
    public Response login(@NotNull @Valid LoginDTO dto) {
        AuthService.ResultadoSessao sessao = service.login(dto);
        return responderComSessao(Response.Status.OK, sessao);
    }

    @POST
    @Path("/cadastro")
    @PermitAll
    public Response cadastrar(@NotNull @Valid CadastroContaDTO dto) {
        AuthService.ResultadoSessao sessao = service.cadastrar(dto);
        return responderComSessao(Response.Status.CREATED, sessao);
    }

    @POST
    @Path("/refresh")
    @PermitAll
    @Consumes(MediaType.WILDCARD)
    public Response renovar(
            @CookieParam(COOKIE_REFRESH) String refreshToken,
            @HeaderParam("Origin") String origin) {
        validarOrigemNavegador(origin);
        AuthService.ResultadoSessao sessao = service.renovar(refreshToken);
        return responderComSessao(Response.Status.OK, sessao);
    }

    @GET
    @Path("/me")
    @RolesAllowed({ "customer", "admin" })
    public Response me() {
        return Response.ok(service.usuarioAtual()).build();
    }

    @POST
    @Path("/logout")
    @PermitAll
    @Consumes(MediaType.WILDCARD)
    public Response logout(
            @CookieParam(COOKIE_REFRESH) String refreshToken,
            @HeaderParam("Origin") String origin) {
        validarOrigemNavegador(origin);
        service.logout(refreshToken);
        return Response.noContent()
                .header(HttpHeaders.SET_COOKIE, montarCookie("", 0))
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .build();
    }

    private Response responderComSessao(Response.Status status, AuthService.ResultadoSessao sessao) {
        Response.ResponseBuilder builder = Response.status(status)
                .entity(sessao.resposta())
                .header(HttpHeaders.CACHE_CONTROL, "no-store");
        if (sessao.refreshToken() != null && !sessao.refreshToken().isBlank()) {
            long maxAge = Math.max(60L, sessao.refreshExpiresIn());
            builder.header(HttpHeaders.SET_COOKIE, montarCookie(sessao.refreshToken(), maxAge));
        }
        return builder.build();
    }

    private String montarCookie(String valor, long maxAge) {
        return COOKIE_REFRESH + "=" + valor
                + "; Path=/auth; Max-Age=" + maxAge
                + "; HttpOnly; SameSite=Lax"
                + (cookieSecure ? "; Secure" : "");
    }

    private void validarOrigemNavegador(String origin) {
        if (origin == null || origin.isBlank()) {
            return;
        }
        Set<String> permitidas = Arrays.stream(origensPermitidas.split(","))
                .map(String::strip)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toSet());
        if (!permitidas.contains(origin.strip())) {
            throw new AutenticacaoException(
                    403, "Origem não autorizada", "A origem da requisição não está autorizada.");
        }
    }
}
