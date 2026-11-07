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
@io.quarkus.test.security.TestSecurity(user = "catalog-admin", roles = "admin")
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
        given().get("/ceps/01001-000/frete").then().statusCode(200)
            .body("cep", is("01001000"))
            .body("localidade", is(""))
            .body("uf", is(""))
            .body("valorFrete", is(29.90f))
            .body("prazoDiasUteis", is(5));
        given().get("/ceps/123/frete").then().statusCode(400);
        given().get("/ceps/99999999/frete").then().statusCode(200);
        given().get("/ceps/88888888/frete").then().statusCode(200);
        given().delete("/clientes/" + Long.MAX_VALUE).then().statusCode(404);
    }

    @Test
    void manualAddressIgnoresUnavailableLookupAndValidatesLocalMunicipality() {
        var dto = dados();
        dto.put("cep", "88888888"); // The fixture returns 503 for this postcode.
        dto.put("codigoIbge", "3550308");
        long id = given().contentType("application/json").body(dto).post("/clientes")
                .then().statusCode(201).body("municipio.estado.sigla", is("SP"))
                .extract().jsonPath().getLong("id");
        try {
            dto.put("codigoIbge", "1721000");
            given().contentType("application/json").body(dto).put("/clientes/" + id)
                    .then().statusCode(200).body("municipio.nome", is("Palmas"));
            for (String codigo : new String[] {"9999999", "123", ""}) {
                dto.put("codigoIbge", codigo);
                given().contentType("application/json").body(dto).put("/clientes/" + id)
                        .then().statusCode(400).body("errors.field", hasItem("codigoIbge"));
            }
            given().get("/clientes/" + id).then().statusCode(200)
                    .body("municipio.codigoIbge", is("1721000"));
            dto.put("codigoIbge", "3550308");
            dto.put("cep", "123");
            given().contentType("application/json").body(dto).put("/clientes/" + id)
                    .then().statusCode(400).body("errors.field", hasItem("cep"));
        } finally {
            given().delete("/clientes/" + id).then().statusCode(204);
        }
    }

    @Test
    void deveCadastrarEAtualizarClienteComCpfDataNascimentoETelefones3Nf() {
        var dto = dados();
        String cpf = String.format("%011d", Math.abs(UUID.randomUUID().getMostSignificantBits()) % 100000000000L);
        dto.put("cpf", cpf);
        dto.put("dataNascimento", "1998-05-14");
        dto.put("telefones", java.util.List.of(
                Map.of("ddd", "63", "numero", "999887766", "tipoTelefone", 1, "principal", true),
                Map.of("ddd", "63", "numero", "32154433", "tipoTelefone", 2, "principal", false)));

        var criado = given().contentType("application/json").body(dto).post("/clientes")
                .then().statusCode(201)
                .body("cpf", is(cpf))
                .body("dataNascimento", is("1998-05-14"))
                .body("telefones", hasSize(2))
                .body("telefones[0].ddd", is("63"))
                .body("telefones[0].principal", is(true))
                .extract().jsonPath();
        long id = criado.getLong("id");

        var duplicadoCpf = dados();
        duplicadoCpf.put("cpf", cpf);
        given().contentType("application/json").body(duplicadoCpf).post("/clientes")
                .then().statusCode(400)
                .body("errors.field", hasItem("cpf"));

        dto.put("telefones", java.util.List.of(
                Map.of("ddd", "11", "numero", "988776655", "tipoTelefone", 1, "principal", true),
                Map.of("ddd", "11", "numero", "988776655", "tipoTelefone", 1, "principal", false)));
        given().contentType("application/json").body(dto).put("/clientes/" + id)
                .then().statusCode(400)
                .body("errors.field", hasItem("telefones"));

        given().delete("/clientes/" + id).then().statusCode(204);
    }
}
