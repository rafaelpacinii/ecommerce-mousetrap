package br.unitins.tp2.resource;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import br.unitins.tp2.model.Cliente;
import br.unitins.tp2.repository.ClienteRepository;
import br.unitins.tp2.repository.EnderecoRepository;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.test.common.QuarkusTestResource;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import io.quarkus.test.security.TestSecurity;
import io.quarkus.test.security.oidc.Claim;
import io.quarkus.test.security.oidc.ClaimType;
import io.quarkus.test.security.oidc.OidcSecurity;
import io.restassured.response.Response;
import jakarta.inject.Inject;

@QuarkusTest
@TestProfile(CatalogoTestProfile.class)
@QuarkusTestResource(value = KeycloakTestResource.class, restrictToAnnotatedClass = true)
class AuthResourceTest {
    @Inject
    ClienteRepository clientes;

    @Inject
    EnderecoRepository enderecos;

    private final List<Long> clientesCriados = new ArrayList<>();

    @AfterEach
    void limpar() {
        QuarkusTransaction.requiringNew().run(() -> clientesCriados.forEach(clientes::deleteById));
    }

    @Test
    void cadastroMinimoCriaContaNoKeycloakVinculaClienteSemSenhaERenovaAteLogout() {
        String email = "novo-" + UUID.randomUUID() + "@example.test";
        Response cadastro = given()
                .contentType("application/json")
                .body(Map.of(
                        "nome", "Rafael Pacini",
                        "email", email.toUpperCase(),
                        "senha", "SenhaForte123",
                        "telefone", "(63) 99988-7766"))
                .post("/auth/cadastro")
                .then()
                .statusCode(201)
                .header("Cache-Control", containsString("no-store"))
                .header("Set-Cookie", allOf(
                        containsString("mousetrap_refresh=rt-"),
                        containsString("HttpOnly"),
                        containsString("Path=/auth"),
                        containsString("SameSite=Lax")))
                .body("accessToken", not(emptyOrNullString()))
                .body("usuario.email", is(email))
                .body("usuario.nome", is("Rafael Pacini"))
                .body("usuario.roles", contains("customer"))
                .body("usuario.perfilCompleto", is(false))
                .extract()
                .response();

        String subject = cadastro.jsonPath().getString("usuario.subject");
        String refreshCookie = cadastro.getCookie(AuthResource.COOKIE_REFRESH);
        assertNotNull(refreshCookie);

        QuarkusTransaction.requiringNew().run(() -> {
            Cliente salvo = clientes.findByIdentidadeSubject(subject);
            assertNotNull(salvo);
            clientesCriados.add(salvo.getId());
            assertEquals(email, salvo.getEmail());
            assertNull(salvo.getMunicipio());
            assertEquals(1, salvo.getTelefones().size());
            assertEquals("63", salvo.getTelefones().get(0).getDdd());
        });

        // Renova sessão usando o cookie HttpOnly e rotaciona o refresh_token
        Response refresh = given()
                .cookie(AuthResource.COOKIE_REFRESH, refreshCookie)
                .header("Origin", "http://localhost:4200")
                .post("/auth/refresh")
                .then()
                .statusCode(200)
                .body("accessToken", not(emptyOrNullString()))
                .body("usuario.subject", is(subject))
                .extract()
                .response();

        String refreshRotacionado = refresh.getCookie(AuthResource.COOKIE_REFRESH);
        assertNotEquals(refreshCookie, refreshRotacionado);

        // O refresh_token antigo não pode ser reutilizado após rotação
        given()
                .cookie(AuthResource.COOKIE_REFRESH, refreshCookie)
                .post("/auth/refresh")
                .then()
                .statusCode(401);

        // Logout revoga no Keycloak e limpa o cookie HttpOnly
        given()
                .cookie(AuthResource.COOKIE_REFRESH, refreshRotacionado)
                .header("Origin", "http://localhost:4200")
                .post("/auth/logout")
                .then()
                .statusCode(204)
                .header("Set-Cookie", containsString("Max-Age=0"));

        given()
                .cookie(AuthResource.COOKIE_REFRESH, refreshRotacionado)
                .post("/auth/refresh")
                .then()
                .statusCode(401);
    }

    @Test
    void cadastroComEnderecoCompletoMarcaPerfilCompletoESincronizaEnderecoPrincipal() {
        String email = "completo-" + UUID.randomUUID() + "@example.test";
        String subject = given()
                .contentType("application/json")
                .body(Map.of(
                        "nome", "Compradora Palmas",
                        "email", email,
                        "senha", "SenhaForte123",
                        "cep", "77020-020",
                        "codigoIbge", "1721000",
                        "logradouro", "Quadra 104 Sul",
                        "bairro", "Plano Diretor Sul",
                        "numero", "12",
                        "complemento", "Sala 4"))
                .post("/auth/cadastro")
                .then()
                .statusCode(201)
                .body("usuario.perfilCompleto", is(true))
                .extract()
                .jsonPath()
                .getString("usuario.subject");

        QuarkusTransaction.requiringNew().run(() -> {
            Cliente salvo = clientes.findByIdentidadeSubject(subject);
            assertNotNull(salvo);
            clientesCriados.add(salvo.getId());
            assertNotNull(salvo.getMunicipio());
            assertEquals("1721000", salvo.getMunicipio().getCodigoIbge());
            assertEquals(1, enderecos.findByClienteId(salvo.getId()).size());
        });
    }

    @Test
    void rejeitaCredenciaisInvalidasSemPapelOrigemExternaEDuplicidadeDeEmail() {
        // Senha incorreta -> 401
        given()
                .contentType("application/json")
                .body(Map.of("email", "admin@mousetrap.test", "senha", "Errada123"))
                .post("/auth/login")
                .then()
                .statusCode(401)
                .body("detail", containsString("E-mail ou senha inválidos"));

        // Conta no Keycloak sem papel customer/admin -> 403
        given()
                .contentType("application/json")
                .body(Map.of("email", "semrole@mousetrap.test", "senha", "SemRole@1234"))
                .post("/auth/login")
                .then()
                .statusCode(403);

        // Login válido de admin -> 200 com papéis admin e customer
        given()
                .contentType("application/json")
                .body(Map.of("email", "admin@mousetrap.test", "senha", "Admin@1234"))
                .post("/auth/login")
                .then()
                .statusCode(200)
                .body("usuario.roles", hasItems("admin", "customer"));

        // Origem não autorizada em /auth/refresh -> 403
        given()
                .cookie(AuthResource.COOKIE_REFRESH, "rt-qualquer")
                .header("Origin", "https://malicioso.example")
                .post("/auth/refresh")
                .then()
                .statusCode(403);

        // Pré-existência de e-mail local bloqueia cadastro sem reivindicar conta (BR-IAM-07)
        String legadoEmail = "legado-" + UUID.randomUUID() + "@example.test";
        QuarkusTransaction.requiringNew().run(() -> {
            Cliente legado = new Cliente();
            legado.setNome("Cliente Legado");
            legado.setEmail(legadoEmail);
            clientes.persistAndFlush(legado);
            clientesCriados.add(legado.getId());
        });

        given()
                .contentType("application/json")
                .body(Map.of(
                        "nome", "Tentativa Colisão",
                        "email", legadoEmail,
                        "senha", "SenhaForte123"))
                .post("/auth/cadastro")
                .then()
                .statusCode(409);

        // Senha fraca -> 400 Bean Validation
        given()
                .contentType("application/json")
                .body(Map.of(
                        "nome", "Senha Fraca",
                        "email", "fraca@example.test",
                        "senha", "12345678"))
                .post("/auth/cadastro")
                .then()
                .statusCode(400)
                .body("errors.field", hasItem("senha"));
    }

    @Test
    void endpointMeExigeTokenValidoERetornaDadosDoUsuarioAutenticado() {
        given().get("/auth/me").then().statusCode(401);
    }

    @Test
    @TestSecurity(user = "cliente-autenticado", roles = "customer")
    @OidcSecurity(claims = {
            @Claim(key = "sub", value = "sub-me-check"),
            @Claim(key = "email", value = "me-check@example.test"),
            @Claim(key = "name", value = "Cliente Sessão"),
            @Claim(key = "email_verified", value = "true", type = ClaimType.BOOLEAN) })
    void endpointMeRetornaUsuarioAutenticadoComSeusPapeis() {
        given()
                .get("/auth/me")
                .then()
                .statusCode(200)
                .body("subject", is("sub-me-check"))
                .body("email", is("me-check@example.test"))
                .body("nome", is("Cliente Sessão"))
                .body("roles", contains("customer"))
                .body("perfilCompleto", is(false));
    }

    @Test
    @TestSecurity(user = "usuario-sem-papel", roles = "outro")
    void endpointMeNegaAcessoParaPapelDesconhecido() {
        given().get("/auth/me").then().statusCode(403);
    }
}
