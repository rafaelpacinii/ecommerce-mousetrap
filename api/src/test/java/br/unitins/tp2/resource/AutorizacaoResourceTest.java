package br.unitins.tp2.resource;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import br.unitins.tp2.model.Cliente;
import br.unitins.tp2.repository.ClienteRepository;
import br.unitins.tp2.repository.EstadoRepository;
import br.unitins.tp2.repository.MunicipioRepository;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.test.common.QuarkusTestResource;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import io.quarkus.test.security.TestSecurity;
import io.quarkus.test.security.oidc.Claim;
import io.quarkus.test.security.oidc.ClaimType;
import io.quarkus.test.security.oidc.OidcSecurity;
import jakarta.inject.Inject;

@QuarkusTest
@TestProfile(CatalogoTestProfile.class)
@QuarkusTestResource(value = ViaCepTestResource.class, restrictToAnnotatedClass = true)
class AutorizacaoResourceTest {
    @Inject ClienteRepository clientes;
    @Inject MunicipioRepository municipios;
    @Inject EstadoRepository estados;
    final List<Long> criados = new ArrayList<>();

    Map<String, Object> perfil() {
        return Map.of("nome", "Minha conta", "cep", "01001000", "logradouro", "Praça da Sé",
                "bairro", "Sé", "numero", "15", "complemento", "Apto 1");
    }

    long outroCliente(String email, String subject) {
        return QuarkusTransaction.requiringNew().call(() -> {
            municipios.inserirSeAusente("São Paulo", "3550308", estados.findBySigla("SP").getId());
            Cliente c = new Cliente();
            c.setNome("Cadastro existente"); c.setEmail(email); c.setIdentidadeSubject(subject);
            c.setCep("01001000"); c.setLogradouro("Praça da Sé"); c.setBairro("Sé"); c.setNumero("1");
            c.setMunicipio(municipios.findByCodigoIbge("3550308"));
            clientes.persistAndFlush(c); criados.add(c.getId()); return c.getId();
        });
    }

    @AfterEach void limpar() {
        QuarkusTransaction.requiringNew().run(() -> criados.forEach(clientes::deleteById));
    }

    @Test void visitanteConsultaCatalogoMasNaoAdministracaoOuPerfis() {
        given().get("/catalogo/mouses").then().statusCode(200);
        given().get("/catalogo/filtros").then().statusCode(200);
        given().get("/ceps/01001000").then().statusCode(200);
        for (String path : List.of("/clientes", "/clientes/me", "/mouses", "/marcas")) {
            given().get(path).then().statusCode(401);
        }
        given().contentType("application/json").body(perfil()).put("/clientes/me").then().statusCode(401);
        given().contentType("application/json").body(Map.of("nome", "Bloqueada", "ativo", true))
                .post("/marcas").then().statusCode(401);
    }

    @Test
    @TestSecurity(user = "comprador", roles = "customer")
    @OidcSecurity(claims = {@Claim(key = "sub", value = "customer-a"),
            @Claim(key = "email", value = "customer-a@example.com"),
            @Claim(key = "email_verified", value = "true", type = ClaimType.BOOLEAN)})
    void clienteAcessaSomenteSeuPerfilENaoPodeAdministrar() {
        long outro = outroCliente("customer-b@example.com", "customer-b");
        for (String path : List.of("/clientes", "/clientes/" + outro, "/marcas", "/mouses")) {
            given().get(path).then().statusCode(403);
        }
        given().get("/clientes/me").then().statusCode(404);
        long id = given().contentType("application/json").body(perfil()).put("/clientes/me").then()
                .statusCode(200).body("email", is("customer-a@example.com"))
                .body("id", not(is((int) outro))).extract().jsonPath().getLong("id");
        criados.add(id);
        given().contentType("application/json").body(perfil()).put("/clientes/me").then()
                .statusCode(200).body("id", is((int) id));
        given().get("/clientes/me").then().statusCode(200).body("id", is((int) id));
        given().delete("/clientes/" + outro).then().statusCode(403);
        given().contentType("application/json").body(Map.of("nome", "Bloqueada", "ativo", true))
                .post("/marcas").then().statusCode(403);
    }

    @Test
    @TestSecurity(user = "comprador", roles = "customer")
    @OidcSecurity(claims = {@Claim(key = "sub", value = "customer-a"),
            @Claim(key = "email", value = "customer-a@example.com"),
            @Claim(key = "email_verified", value = "true", type = ClaimType.BOOLEAN)})
    void naoReivindicaCadastroAntigoApenasPeloEmail() {
        outroCliente("customer-a@example.com", null);
        given().contentType("application/json").body(perfil()).put("/clientes/me").then().statusCode(400);
        given().get("/clientes/me").then().statusCode(404);
    }

    @Test
    @TestSecurity(user = "sem-confirmacao", roles = "customer")
    @OidcSecurity(claims = {@Claim(key = "sub", value = "unverified"),
            @Claim(key = "email", value = "unverified@example.com"),
            @Claim(key = "email_verified", value = "false", type = ClaimType.BOOLEAN)})
    void exigeEmailConfirmadoParaSalvar() {
        given().contentType("application/json").body(perfil()).put("/clientes/me").then().statusCode(403);
    }

    @Test
    @TestSecurity(user = "sem-perfil", roles = "unrelated")
    void usuarioSemPapelNaoAcessaConta() {
        given().get("/clientes/me").then().statusCode(403);
    }

    @Test
    @TestSecurity(user = "administrador", roles = "admin")
    void administradorMantemAcessoAoCrud() {
        given().get("/clientes").then().statusCode(200);
        given().get("/marcas").then().statusCode(200);
        given().get("/mouses").then().statusCode(200);
    }
}
