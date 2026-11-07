package br.unitins.tp2.resource;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;
import org.junit.jupiter.api.Test;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;

@QuarkusTest
@TestProfile(CatalogoTestProfile.class)
class LocalidadeResourceTest {
    @Test
    void publicCatalogContainsAllStatesAndOfficialMunicipalities() {
        given().get("/localidades/estados").then().statusCode(200)
                .body("size()", is(27)).body("sigla", hasItems("SP", "TO", "DF"));
        given().get("/localidades/estados/TO/municipios").then().statusCode(200)
                .body("size()", is(139)).body("codigoIbge", hasItem("1721000"))
                .body("estado.sigla", everyItem(is("TO")));
        given().get("/localidades/estados/MT/municipios").then().statusCode(200)
                .body("codigoIbge", hasItem("5101837")); // Boa Esperança do Norte, without a legacy microregion.
        given().get("/localidades/estados/XX/municipios").then().statusCode(400);
        given().get("/localidades/estados/SP/municipios").then().statusCode(200)
                .body("codigoIbge", hasItem("3550308"));
    }
}
