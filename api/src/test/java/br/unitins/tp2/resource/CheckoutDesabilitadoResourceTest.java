package br.unitins.tp2.resource;
import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import io.quarkus.test.junit.*;
import io.quarkus.test.security.TestSecurity;
import io.quarkus.test.security.oidc.*;
@QuarkusTest
@TestProfile(CheckoutDesabilitadoResourceTest.Perfil.class)
@TestSecurity(user = "checkout-disabled", roles = "customer")
@OidcSecurity(claims = {@Claim(key = "sub", value = "checkout-disabled")})
class CheckoutDesabilitadoResourceTest {
    public static class Perfil extends CatalogoTestProfile {
        @Override public Map<String,String> getConfigOverrides() {
            var config = new HashMap<>(super.getConfigOverrides());
            config.put("pagamentos.simulacao.habilitada", "false"); return config;
        }
    }
    @Test void ambienteSemSimuladorNaoCriaPedidoOuPagamento() {
        given().get("/pedidos/configuracao").then().statusCode(200).body("simulacaoHabilitada", is(false));
        given().contentType("application/json").body(Map.of("chaveCheckout", UUID.randomUUID(), "idEndereco", 1,
            "itens", List.of(Map.of("idMouse",1,"quantidade",1,"precoEsperado",100)),"freteEsperado",29.90))
            .post("/pedidos").then().statusCode(400).body("errors.field",hasItem("checkout"));
        given().contentType("application/json").body(Map.of("chaveIdempotencia", UUID.randomUUID(),"forma",1,"resultadoSimulado",1))
            .post("/pedidos/1/pagamentos").then().statusCode(400).body("errors.field",hasItem("checkout"));
    }
}
