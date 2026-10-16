package br.unitins.tp2.resource;

import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import com.sun.net.httpserver.HttpServer;
import io.quarkus.test.common.QuarkusTestResourceLifecycleManager;

public class ViaCepTestResource implements QuarkusTestResourceLifecycleManager {
    private HttpServer server;
    @Override
    public Map<String, String> start() {
        try {
            server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
            server.createContext("/ws/", exchange -> {
                String path = exchange.getRequestURI().getPath();
                int status = path.contains("88888888") ? 503 : 200;
                String body = path.contains("99999999") ? "{\"erro\":true}" : path.contains("77001000")
                    ? "{\"cep\":\"77001-000\",\"logradouro\":\"\",\"bairro\":\"\",\"localidade\":\"Palmas\",\"uf\":\"TO\",\"ibge\":\"1721000\"}"
                    : "{\"cep\":\"01001-000\",\"logradouro\":\"Praça da Sé\",\"bairro\":\"Sé\",\"localidade\":\"São Paulo\",\"uf\":\"SP\",\"ibge\":\"3550308\"}";
                byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
                exchange.sendResponseHeaders(status, bytes.length);
                try (var output = exchange.getResponseBody()) { output.write(bytes); }
            });
            server.start();
            return Map.of("viacep.url", "http://127.0.0.1:" + server.getAddress().getPort() + "/ws/");
        } catch (Exception e) { throw new IllegalStateException(e); }
    }
    @Override
    public void stop() { if (server != null) server.stop(0); }
}
