package br.unitins.tp2.resource;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import io.quarkus.test.common.QuarkusTestResource;

@QuarkusTest
@TestProfile(CatalogoTestProfile.class)
@QuarkusTestResource(value = ViaCepTestResource.class, restrictToAnnotatedClass = true)
class ClienteResourceTest {
    private Map<String, Object> dados() {
        return new HashMap<>(Map.of("nome", "Cliente MouseTrap", "email", UUID.randomUUID() + "@example.com",
            "cep", "01001000", "logradouro", "Praça da Sé", "bairro", "Sé", "numero", "10", "complemento", "Apto 1"));
    }
    @Test
    void cadastrarEditarListarExcluirEReutilizarMunicipio() {
        var dto = dados();
        var criado = given().contentType("application/json").body(dto).post("/clientes").then().statusCode(201)
            .body("municipio.codigoIbge", is("3550308")).body("municipio.estado.sigla", is("SP")).extract().jsonPath();
        long id = criado.getLong("id");
        var segundo = given().contentType("application/json").body(dados()).post("/clientes").then().statusCode(201)
            .body("municipio.id", is(criado.getInt("municipio.id"))).extract().jsonPath();
        given().get("/clientes/" + id).then().statusCode(200).body("nome", is("Cliente MouseTrap"));
        given().get("/clientes").then().statusCode(200).body("id", hasItem((int) id));
        given().contentType("application/json").body(dto).post("/clientes").then().statusCode(400).body("errors.field", hasItem("email"));
        dto.put("cep", "77001000"); dto.put("logradouro", "Quadra 101"); dto.put("bairro", "Plano Diretor");
        given().contentType("application/json").body(dto).put("/clientes/" + id).then().statusCode(200)
            .body("municipio.codigoIbge", is("1721000")).body("municipio.estado.sigla", is("TO"));
        given().delete("/clientes/" + id).then().statusCode(204);
        given().delete("/clientes/" + segundo.getLong("id")).then().statusCode(204);
        given().get("/clientes/" + id).then().statusCode(404);
    }
    @Test
    void validarFormularioECepNoBackend() {
        var dto = dados();
        dto.put("nome", " "); dto.put("email", "invalido"); dto.put("numero", " "); dto.put("cep", "123");
        given().contentType("application/json").body(dto).post("/clientes").then().statusCode(400)
            .body("errors.field", hasItems("nome", "email", "numero", "cep"));
        dto = dados(); dto.put("cep", "99999999");
        given().contentType("application/json").body(dto).post("/clientes").then().statusCode(400).body("errors.field", hasItem("cep"));
        dto.put("cep", "88888888");
        given().contentType("application/json").body(dto).post("/clientes").then().statusCode(503);
        given().get("/ceps/123").then().statusCode(400);
        given().get("/ceps/99999999").then().statusCode(400);
        given().get("/ceps/01001000").then().statusCode(200).body("ibge", is("3550308"));
        given().delete("/clientes/" + Long.MAX_VALUE).then().statusCode(404);
    }
}
