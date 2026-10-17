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
        given().get("/ceps/01001000/frete").then().statusCode(200);
        for (String path : List.of("/clientes", "/clientes/me", "/clientes/me/enderecos", "/mouses", "/marcas")) {
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
        given().get("/clientes/me/enderecos").then().statusCode(200).body("$", empty());
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
    @OidcSecurity(claims = {@Claim(key = "sub", value = "customer-addr"),
            @Claim(key = "email", value = "customer-addr@example.com"),
            @Claim(key = "email_verified", value = "true", type = ClaimType.BOOLEAN)})
    void clienteGerenciaSeusEnderecosComEscopoDeProprietario() {
        long idCliente = given().contentType("application/json").body(perfil()).put("/clientes/me").then()
                .statusCode(200).extract().jsonPath().getLong("id");
        criados.add(idCliente);

        long idPrincipal = given().get("/clientes/me/enderecos").then()
                .statusCode(200)
                .body("size()", is(1))
                .body("[0].principal", is(true))
                .body("[0].apelido", is("Principal"))
                .extract().jsonPath().getLong("[0].id");

        // Não pode excluir o único endereço restante
        given().delete("/clientes/me/enderecos/" + idPrincipal).then().statusCode(400);

        // Cria segundo endereço
        Map<String, Object> segundo = Map.of(
                "apelido", "Trabalho",
                "destinatario", "Cliente Trabalho",
                "cep", "77001-000",
                "logradouro", "Quadra 104 Sul",
                "bairro", "Plano Diretor Sul",
                "numero", "20",
                "complemento", "Sala 2",
                "principal", false);
        long idSegundo = given().contentType("application/json").body(segundo)
                .post("/clientes/me/enderecos").then()
                .statusCode(201)
                .body("apelido", is("Trabalho"))
                .body("principal", is(false))
                .body("municipio.estado.sigla", is("TO"))
                .extract().jsonPath().getLong("id");

        // Define segundo endereço como principal e sincroniza com /clientes/me
        given().put("/clientes/me/enderecos/" + idSegundo + "/principal").then()
                .statusCode(200)
                .body("principal", is(true));
        given().get("/clientes/me").then()
                .statusCode(200)
                .body("cep", is("77001000"))
                .body("logradouro", is("Quadra 104 Sul"));

        // Atualiza endereço
        Map<String, Object> segundoEditado = Map.of(
                "apelido", "Escritório",
                "destinatario", "Cliente Trabalho",
                "cep", "77001000",
                "logradouro", "Quadra 204 Sul",
                "bairro", "Plano Diretor Sul",
                "numero", "30",
                "complemento", "",
                "principal", true);
        given().contentType("application/json").body(segundoEditado)
                .put("/clientes/me/enderecos/" + idSegundo).then()
                .statusCode(200)
                .body("apelido", is("Escritório"))
                .body("logradouro", is("Quadra 204 Sul"));

        // Exclui o principal; o outro endereço é promovido automaticamente a principal
        given().delete("/clientes/me/enderecos/" + idSegundo).then().statusCode(204);
        given().get("/clientes/me/enderecos").then()
                .statusCode(200)
                .body("size()", is(1))
                .body("[0].id", is((int) idPrincipal))
                .body("[0].principal", is(true));
        given().get("/clientes/me").then()
                .statusCode(200)
                .body("cep", is("01001000"));
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
