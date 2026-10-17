package br.unitins.tp2.resource;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;
import org.junit.jupiter.api.Test;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import io.quarkus.test.security.TestSecurity;

@QuarkusTest
@TestProfile(CatalogoTestProfile.class)
class ImagemResourceTest {
    private static final byte[] PNG = java.util.Base64.getDecoder().decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aBxkAAAAASUVORK5CYII=");

    @Test void rejectsAnonymousUploads() {
        given().multiPart("arquivo", "image.png", PNG, "image/png").post("/imagens/mouses").then().statusCode(401);
    }

    @Test @TestSecurity(user = "customer", roles = "customer")
    void rejectsCustomerUploads() {
        given().multiPart("arquivo", "image.png", PNG, "image/png").post("/imagens/marcas").then().statusCode(403);
    }

    @Test @TestSecurity(user = "admin", roles = "admin")
    void validatesMultipartAndReturnsUsefulStorageError() {
        given().multiPart("arquivo", "image.png", PNG, "image/png").post("/imagens/mouses").then()
                .statusCode(503).contentType("application/problem+json").body("detail", containsString("imagens"));
        given().multiPart("arquivo", "fake.png", "not an image".getBytes(), "image/png").post("/imagens/mouses").then()
                .statusCode(400).body("errors.field", hasItem("arquivo"));
        given().multiPart("arquivo", "image.png", PNG, "image/png").post("/imagens/other").then()
                .statusCode(400).body("errors.field", hasItem("destino"));
        given().multiPart("outro", "image.png", PNG, "image/png").post("/imagens/mouses").then()
                .statusCode(400).body("errors.field", hasItem("arquivo"));
        given().multiPart("arquivo", "large.png", new byte[5 * 1024 * 1024 + 1], "image/png").post("/imagens/mouses").then()
                .statusCode(400).body("errors.field", hasItem("arquivo"));
    }
}
