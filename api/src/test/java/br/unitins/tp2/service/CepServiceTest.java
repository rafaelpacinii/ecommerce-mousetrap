package br.unitins.tp2.service;

import static org.junit.jupiter.api.Assertions.*;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import com.sun.net.httpserver.HttpServer;
import com.fasterxml.jackson.databind.ObjectMapper;
import br.unitins.tp2.exception.ValidationException;
import jakarta.ws.rs.ServiceUnavailableException;
import org.junit.jupiter.api.*;

class CepServiceTest {
    private HttpServer server;
    private CepServiceImpl service;
    private int status = 200;
    private String body;
    private int consultas;

    @BeforeEach
    void iniciar() throws Exception {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/ws/", exchange -> {
            consultas++;
            byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(status, bytes.length);
            try (var output = exchange.getResponseBody()) { output.write(bytes); }
        });
        server.start();
        service = new CepServiceImpl();
        service.mapper = new ObjectMapper();
        service.url = "http://127.0.0.1:" + server.getAddress().getPort() + "/ws/";
        body = """
            {"cep":"01001-000","logradouro":"Praça da Sé","bairro":"Sé","localidade":"São Paulo","uf":"SP","ibge":"3550308"}
            """;
    }

    @AfterEach
    void parar() { if (server != null) server.stop(0); }

    @Test
    void consultarCepEMapearDados() {
        var cep = service.consultar("01001000");
        assertEquals("3550308", cep.ibge());
        assertEquals("SP", cep.uf());
        assertEquals("Praça da Sé", cep.logradouro());
    }

    @Test
    void rejeitarFormatoAntesDaChamadaExterna() {
        for (String cep : new String[] { null, "123", "01001-000", "01001A00" })
            assertThrows(ValidationException.class, () -> service.consultar(cep));
        assertEquals(0, consultas);
    }

    @Test
    void rejeitarCepInexistente() {
        body = "{\"erro\":true}";
        assertThrows(ValidationException.class, () -> service.consultar("99999999"));
    }

    @Test
    void tratarFalhaHttpJsonInvalidoEDadosIncompletos() {
        status = 500;
        assertThrows(ServiceUnavailableException.class, () -> service.consultar("01001000"));
        status = 200;
        for (String resposta : new String[] { "invalido", "{}", "null", "{\"cep\":\"01001-000\",\"ibge\":\"3550308\",\"uf\":\"SP\"}" }) {
            body = resposta;
            assertThrows(ServiceUnavailableException.class, () -> service.consultar("01001000"));
        }
    }

    @Test
    void permitirCepGenericoComCamposParaPreenchimentoManual() {
        body = "{\"cep\":\"01001-000\",\"logradouro\":\"\",\"bairro\":\"\",\"localidade\":\"São Paulo\",\"uf\":\"SP\",\"ibge\":\"3550308\"}";
        assertEquals("", service.consultar("01001000").logradouro());
    }
}
