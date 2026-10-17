package br.unitins.tp2.resource;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.AfterEach;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;

@QuarkusTest
@TestProfile(CatalogoTestProfile.class)
class CatalogoPublicoResourceTest {
    final List<Long> produtos = new ArrayList<>();
    final List<Long> marcas = new ArrayList<>();
    final String prefixo = "ZZ-Publico-" + UUID.randomUUID();

    long marca(boolean ativo) {
        long id = given().contentType("application/json").body(Map.of("nome", prefixo + UUID.randomUUID(), "ativo", ativo))
                .post("/marcas").then().statusCode(201).extract().jsonPath().getLong("id");
        marcas.add(id); return id;
    }

    Map<String, Object> dto(long marca, String nome, int preco) {
        return new HashMap<>(Map.ofEntries(Map.entry("sku", "PUBLICO-" + UUID.randomUUID()), Map.entry("nome", prefixo + nome),
                Map.entry("descricao", "Mouse de teste do catálogo público"), Map.entry("cor", "Preto"), Map.entry("preco", preco),
                Map.entry("quantidadeEstoque", 5), Map.entry("dpiMaximo", 26000), Map.entry("quantidadeBotoes", 6),
                Map.entry("pesoGramas", 54), Map.entry("ativo", true), Map.entry("idMarca", marca), Map.entry("tiposConexao", List.of(1, 3))));
    }

    Map<String, Object> especificacoes() {
        return Map.of("sensor", "PAW3395", "pollingRate", 8000, "tipoSwitch", 1, "modeloSwitch", "Optical", "pegadas", List.of(2, 3));
    }

    long criar(Map<String, Object> dto) {
        long id = given().contentType("application/json").body(dto).post("/mouses").then().statusCode(201).extract().jsonPath().getLong("id");
        produtos.add(id); return id;
    }

    @AfterEach void limpar() {
        produtos.forEach(id -> given().delete("/mouses/" + id).then().statusCode(204));
        marcas.forEach(id -> given().delete("/marcas/" + id).then().statusCode(204));
    }

    @Test void combinaFiltrosSemDuplicarProdutosEOrdenaPagina() {
        long marca = marca(true);
        var a = dto(marca, " Alpha", 200); a.put("especificacoes", especificacoes()); long id = criar(a);
        var b = dto(marca, " Beta", 300); b.put("especificacoes", especificacoes()); b.put("quantidadeEstoque", 0); criar(b);
        criar(dto(marca, " Outro", 400));
        given().queryParam("nome", prefixo).queryParam("marca", marca).queryParam("sensor", "paw3395")
                .queryParam("conexao", 1, 3).queryParam("pegada", 2, 3).queryParam("pollingRateMin", 4000)
                .queryParam("tipoSwitch", 1).queryParam("pesoMax", 60).queryParam("precoMin", 100).queryParam("precoMax", 350)
                .queryParam("emEstoque", true).get("/catalogo/mouses").then().statusCode(200)
                .body("totalItems", is(1)).body("items.id", contains((int) id))
                .body("items[0].especificacoes.pegadas.id", contains(2, 3));
        given().queryParam("nome", prefixo).queryParam("ordenar", "menor-preco").queryParam("pageSize", 1).queryParam("page", 1)
                .get("/catalogo/mouses").then().statusCode(200).body("items[0].preco", is(300.0f))
                .body("totalItems", is(3)).body("totalPages", is(3));
        given().queryParam("nome", prefixo).queryParam("conexao", 1, 3).get("/catalogo/mouses")
                .then().statusCode(200).body("totalItems", is(3)).body("items", hasSize(3));
        given().queryParam("nome", "%" + prefixo).get("/catalogo/mouses").then().statusCode(200).body("totalItems", is(0));
    }

    @Test void ocultaProdutosEMarcasInativosInclusiveNosDetalhesEFacetas() {
        long marca = marca(true), inativa = marca(false);
        var a = dto(marca, " Visivel", 200); a.put("especificacoes", especificacoes()); long id = criar(a);
        var b = dto(marca, " Inativo", 200); b.put("ativo", false); long oculto = criar(b);
        long marcaOculta = criar(dto(inativa, " Marca inativa", 200));
        given().queryParam("nome", prefixo).get("/catalogo/mouses").then().statusCode(200).body("items.id", contains((int) id));
        given().get("/catalogo/mouses/" + oculto).then().statusCode(404);
        given().get("/catalogo/mouses/" + marcaOculta).then().statusCode(404);
        given().get("/catalogo/mouses/" + id).then().statusCode(200).body("versao", nullValue()).body("ativo", nullValue());
        given().get("/catalogo/filtros").then().statusCode(200).body("marcas.id", hasItem((int) marca))
                .body("marcas.id", not(hasItem((int) inativa))).body("sensores", hasItem("PAW3395"));
    }

    @Test void substituiGaleriaOrdenadaEPreservaCamposOmitidosPorClientesAntigos() {
        var dto = dto(marca(true), " Galeria", 200);
        dto.put("especificacoes", especificacoes());
        dto.put("imagens", List.of(Map.of("url", "/images/lateral.webp", "textoAlternativo", "Vista lateral", "ordem", 1),
                Map.of("url", "https://example.com/capa.webp", "textoAlternativo", "Vista superior", "ordem", 0)));
        long id = criar(dto);
        var resposta = given().get("/mouses/" + id).then().statusCode(200).body("imagens.ordem", contains(0, 1)).extract().jsonPath();
        long versao = resposta.getLong("versao");
        dto.remove("imagens"); dto.remove("especificacoes"); dto.put("versao", versao); dto.put("preco", 250);
        var atualizado = given().contentType("application/json").body(dto).put("/mouses/" + id).then().statusCode(200)
                .body("imagens", hasSize(2)).body("especificacoes.sensor", is("PAW3395")).extract().jsonPath();
        dto.put("versao", atualizado.getLong("versao"));
        dto.put("imagens", List.of(Map.of("url", "/images/nova.webp", "textoAlternativo", "Nova capa", "ordem", 0)));
        var galeria = given().contentType("application/json").body(dto).put("/mouses/" + id).then().statusCode(200)
                .body("imagens", hasSize(1)).body("imagens[0].url", is("/images/nova.webp"))
                .body("versao", greaterThan(atualizado.getInt("versao"))).extract().jsonPath();
        given().contentType("application/json").body(dto).put("/mouses/" + id).then().statusCode(409);
        dto.put("versao", galeria.getLong("versao")); dto.put("imagens", List.of());
        given().contentType("application/json").body(dto).put("/mouses/" + id).then().statusCode(200).body("imagens", empty());
    }

    @Test void rejeitaImagensInvalidasOrdensDuplicadasEFiltrosInvalidos() {
        var dto = dto(marca(true), " Invalido", 200);
        dto.put("imagens", List.of(Map.of("url", "javascript:alert(1)", "textoAlternativo", "Teste", "ordem", 0)));
        given().contentType("application/json").body(dto).post("/mouses").then().statusCode(400);
        dto.put("imagens", List.of(Map.of("url", "https://?", "textoAlternativo", "Teste", "ordem", 0)));
        given().contentType("application/json").body(dto).post("/mouses").then().statusCode(400);
        dto.put("imagens", List.of(Map.of("url", "/a.webp", "textoAlternativo", "A", "ordem", 0), Map.of("url", "/b.webp", "textoAlternativo", "B", "ordem", 0)));
        given().contentType("application/json").body(dto).post("/mouses").then().statusCode(400).body("errors.field", hasItem("imagens"));
        dto.remove("imagens"); dto.put("especificacoes", Map.of("pollingRate", 777));
        given().contentType("application/json").body(dto).post("/mouses").then().statusCode(400);
        for (String filtro : List.of("page=-1", "pageSize=101", "precoMin=10&precoMax=1", "conexao=99", "pegada=9", "ordenar=preco%20desc", "tipoSwitch=99", "marca=0", "pesoMax=0")) {
            given().get("/catalogo/mouses?" + filtro).then().statusCode(400).contentType("application/problem+json");
        }
        given().get("/catalogo/mouses/" + Long.MAX_VALUE).then().statusCode(404);
    }
}
