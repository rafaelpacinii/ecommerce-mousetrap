package br.unitins.tp2.resource;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;

@QuarkusTest
@TestProfile(CatalogoTestProfile.class)
class CatalogoResourceTest {
    private String unico() { return UUID.randomUUID().toString(); }

    private long criarMarca(String nome) {
        return given().contentType("application/json").body(Map.of("nome", nome, "ativo", true))
                .post("/marcas").then().statusCode(201).body("nome", equalTo(nome))
                .extract().jsonPath().getLong("id");
    }

    private Map<String, Object> mouse(long idMarca) {
        return new HashMap<>(Map.ofEntries(
                Map.entry("sku", "M-" + unico()), Map.entry("nome", "Mouse de teste"),
                Map.entry("descricao", "Mouse para validar o catálogo"), Map.entry("cor", "Preto"),
                Map.entry("preco", 199.90), Map.entry("quantidadeEstoque", 8),
                Map.entry("dpiMaximo", 16000), Map.entry("quantidadeBotoes", 6),
                Map.entry("pesoGramas", 75.50), Map.entry("ativo", true),
                Map.entry("idMarca", idMarca), Map.entry("tiposConexao", List.of(1, 2, 3))));
    }

    @Test
    void deveRealizarCrudDeMarcaEValidarNomeDuplicado() {
        String nome = "Marca " + unico();
        long id = criarMarca(nome);
        given().get("/marcas?page=0&pageSize=10").then().statusCode(200)
                .body("items.nome", hasItem(nome)).body("page", is(0)).body("pageSize", is(10));
        given().get("/marcas/" + id).then().statusCode(200).body("nome", equalTo(nome));
        given().contentType("application/json").body(Map.of("nome", "  " + nome.toUpperCase() + "  ", "ativo", true))
                .post("/marcas").then().statusCode(400).contentType("application/problem+json")
                .body("errors.field", hasItem("nome"));
        given().contentType("application/json").body(Map.of("nome", nome + " Editada", "ativo", false))
                .put("/marcas/" + id).then().statusCode(200).body("ativo", is(false));
        given().delete("/marcas/" + id).then().statusCode(204);
        given().get("/marcas/" + id).then().statusCode(404);
    }

    @Test
    void deveFiltrarMarcasPorNomeEPaginarResultados() {
        String prefixo = "Filtro-" + unico();
        criarMarca(prefixo + " Alpha");
        criarMarca(prefixo + " Beta");
        criarMarca(prefixo + " Gamma");

        given().get("/marcas/nome/" + java.net.URLEncoder.encode(prefixo, java.nio.charset.StandardCharsets.UTF_8)
                + "?page=1&pageSize=2")
                .then().statusCode(200).body("items", hasSize(1)).body("totalItems", is(3))
                .body("totalPages", is(2)).body("page", is(1));
        given().get("/marcas?page=-1&pageSize=10").then().statusCode(400);
        given().get("/marcas?page=0&pageSize=101").then().statusCode(400);
    }

    @Test
    void deveRealizarCrudDeMouseEPreservarMarcaVinculada() {
        long idMarca = criarMarca("Fabricante " + unico());
        Map<String, Object> dto = mouse(idMarca);
        var criado = given().contentType("application/json").body(dto).post("/mouses")
                .then().statusCode(201).body("marca.id", equalTo((int) idMarca))
                .body("tiposConexao.id", contains(1, 2, 3)).extract().jsonPath();
        long id = criado.getLong("id");
        long versao = criado.getLong("versao");
        String skuNormalizado = dto.get("sku").toString().toUpperCase(java.util.Locale.ROOT);
        given().get("/mouses/" + id).then().statusCode(200).body("sku", equalTo(skuNormalizado));
        given().get("/mouses?page=0&pageSize=10").then().statusCode(200)
                .body("items.sku", hasItem(skuNormalizado)).body("page", is(0)).body("pageSize", is(10));
        given().delete("/marcas/" + idMarca).then().statusCode(400).body("errors.field", hasItem("marca"));
        given().contentType("application/json").body(dto).post("/mouses")
                .then().statusCode(400).body("errors.field", hasItem("sku"));

        dto.put("versao", versao);
        dto.put("preco", 249.90);
        dto.put("tiposConexao", List.of(2, 3));
        given().contentType("application/json").body(dto).put("/mouses/" + id)
                .then().statusCode(200).body("preco", equalTo(249.90f))
                .body("tiposConexao.id", contains(2, 3)).body("versao", greaterThan((int) versao));
        given().contentType("application/json").body(dto).put("/mouses/" + id)
                .then().statusCode(409).contentType("application/problem+json");
        given().delete("/mouses/" + id).then().statusCode(204);
        given().get("/mouses/" + id).then().statusCode(404);
        given().delete("/marcas/" + idMarca).then().statusCode(204);
    }

    @Test
    void deveFiltrarMousesPorNomeEPaginarResultados() {
        long idMarca = criarMarca("Fabricante filtro " + unico());
        String prefixo = "MouseFiltro-" + unico();
        for (int i = 0; i < 3; i++) {
            Map<String, Object> dto = mouse(idMarca);
            dto.put("nome", prefixo + " " + i);
            given().contentType("application/json").body(dto).post("/mouses").then().statusCode(201);
        }

        given().get("/mouses/nome/" + java.net.URLEncoder.encode(prefixo, java.nio.charset.StandardCharsets.UTF_8)
                + "?page=1&pageSize=2")
                .then().statusCode(200).body("items", hasSize(1)).body("totalItems", is(3))
                .body("totalPages", is(2)).body("page", is(1));
        given().get("/mouses?page=-1&pageSize=10").then().statusCode(400);
        given().get("/mouses?page=0&pageSize=101").then().statusCode(400);
    }

    @Test
    void deveValidarCamposEReferenciaSemPersistirDadosInvalidos() {
        given().contentType("application/json").body(Map.of("nome", " ", "ativo", true))
                .post("/marcas").then().statusCode(400).contentType("application/problem+json")
                .body("errors.field", hasItem("nome"));
        var dto = mouse(Long.MAX_VALUE);
        given().contentType("application/json").body(dto).post("/mouses")
                .then().statusCode(400).body("errors.field", hasItem("idMarca"));
        dto.put("quantidadeEstoque", -1);
        dto.put("preco", 0);
        dto.put("tiposConexao", List.of(9));
        given().contentType("application/json").body(dto).post("/mouses")
                .then().statusCode(400).contentType("application/problem+json")
                .body("errors.field", hasItems("preco", "quantidadeEstoque", "tiposConexao"));
        dto.put("tiposConexao", List.of());
        given().contentType("application/json").body(dto).post("/mouses")
                .then().statusCode(400).body("errors.field", hasItem("tiposConexao"));
    }

    @Test
    void deveRetornar404ParaAlteracaoOuExclusaoInexistente() {
        given().delete("/marcas/" + Long.MAX_VALUE).then().statusCode(404);
        given().delete("/mouses/" + Long.MAX_VALUE).then().statusCode(404);
        given().contentType("application/json").body(Map.of("nome", "Inexistente", "ativo", true))
                .put("/marcas/" + Long.MAX_VALUE).then().statusCode(404);
        given().contentType("application/json").body(mouse(Long.MAX_VALUE))
                .put("/mouses/" + Long.MAX_VALUE).then().statusCode(404);
    }

    @Test
    void devePermitirPreflightDoFrontendComCredenciais() {
        given().header("Origin", "http://localhost:4200")
                .header("Access-Control-Request-Method", "PUT")
                .header("Access-Control-Request-Headers", "content-type")
                .options("/mouses/1").then().statusCode(200)
                .header("Access-Control-Allow-Origin", "http://localhost:4200")
                .header("Access-Control-Allow-Credentials", "true");
    }
}
