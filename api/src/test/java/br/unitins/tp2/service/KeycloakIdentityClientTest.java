package br.unitins.tp2.service;

import static org.junit.jupiter.api.Assertions.*;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import br.unitins.tp2.config.KeycloakAuthConfig;
import br.unitins.tp2.dto.CadastroContaDTO;
import br.unitins.tp2.dto.LoginDTO;
import br.unitins.tp2.exception.AutenticacaoException;
import br.unitins.tp2.resource.KeycloakTestResource;

class KeycloakIdentityClientTest {
    private KeycloakTestResource fakeKeycloak;
    private KeycloakIdentityClientImpl client;

    @BeforeEach
    void setup() {
        fakeKeycloak = new KeycloakTestResource();
        Map<String, String> overrides = fakeKeycloak.start();
        client = new KeycloakIdentityClientImpl();
        client.mapper = new ObjectMapper();
        client.config = new KeycloakAuthConfig() {
            @Override
            public String serverUrl() {
                return overrides.get("keycloak.server-url");
            }

            @Override
            public String realm() {
                return overrides.get("keycloak.realm");
            }

            @Override
            public String clientId() {
                return overrides.get("keycloak.client-id");
            }

            @Override
            public Optional<String> clientSecret() {
                return Optional.of(overrides.get("keycloak.client-secret"));
            }

            @Override
            public Optional<String> adminUsername() {
                return Optional.empty();
            }

            @Override
            public Optional<String> adminPassword() {
                return Optional.empty();
            }

            @Override
            public int timeoutSeconds() {
                return 5;
            }
        };
        client.init();
    }

    @AfterEach
    void teardown() {
        fakeKeycloak.stop();
    }

    @Test
    void provisionaUsuarioComPapelCustomerAutenticaRenovaERevogaSessaoNoKeycloak() {
        String email = "unit-" + UUID.randomUUID() + "@example.test";
        CadastroContaDTO dto = new CadastroContaDTO(
                "  Rafael Pacini  ",
                "  " + email.toUpperCase() + " ",
                "SenhaSegura123",
                "(63) 99988-7766",
                "77020-020",
                " Quadra 104 Sul ",
                " Plano Diretor Sul ",
                " 10 ",
                " ",
                "1721000");

        assertEquals("Rafael Pacini", dto.nome());
        assertEquals(email, dto.email());
        assertEquals("63999887766", dto.telefone());
        assertEquals("77020020", dto.cep());
        assertTrue(dto.possuiDadosEndereco());

        String userId = client.criarUsuarioCliente(dto.nome(), dto.email(), dto.senha());
        assertTrue(userId.startsWith("kc-user-"));

        // Duplicidade de e-mail no Keycloak retorna 409
        AutenticacaoException conflito = assertThrows(
                AutenticacaoException.class,
                () -> client.criarUsuarioCliente(dto.nome(), dto.email(), dto.senha()));
        assertEquals(409, conflito.status());

        // Login retorna access_token e refresh_token
        LoginDTO login = new LoginDTO(" " + email.toUpperCase() + " ", "SenhaSegura123");
        KeycloakIdentityClient.TokenSet tokens = client.autenticar(login.email(), login.senha());
        assertFalse(tokens.accessToken().isBlank());
        assertTrue(tokens.refreshToken().startsWith("rt-"));

        // Refresh rotaciona o refresh_token e invalida o anterior
        KeycloakIdentityClient.TokenSet renovados = client.renovar(tokens.refreshToken());
        assertNotEquals(tokens.refreshToken(), renovados.refreshToken());
        AutenticacaoException reusado = assertThrows(
                AutenticacaoException.class,
                () -> client.renovar(tokens.refreshToken()));
        assertEquals(401, reusado.status());

        // Logout revoga o refresh_token atual no Keycloak
        client.encerrarSessao(renovados.refreshToken());
        AutenticacaoException aposLogout = assertThrows(
                AutenticacaoException.class,
                () -> client.renovar(renovados.refreshToken()));
        assertEquals(401, aposLogout.status());

        // Compensação remove usuário criado
        client.removerUsuario(userId);
        AutenticacaoException removido = assertThrows(
                AutenticacaoException.class,
                () -> client.autenticar(email, "SenhaSegura123"));
        assertEquals(401, removido.status());
    }

    @Test
    void rejeitaCredenciaisInvalidasEFaltaDeClientSecretComMensagensSeguras() {
        AutenticacaoException invalida = assertThrows(
                AutenticacaoException.class,
                () -> client.autenticar("admin@mousetrap.test", "SenhaErrada99"));
        assertEquals(401, invalida.status());
        assertFalse(invalida.getMessage().contains("SenhaErrada99"));

        KeycloakAuthConfig configAnterior = client.config;
        client.config = new KeycloakAuthConfig() {
            @Override public String serverUrl() { return configAnterior.serverUrl(); }
            @Override public String realm() { return "mousetrap"; }
            @Override public String clientId() { return "mousetrap-backend"; }
            @Override public Optional<String> clientSecret() { return Optional.empty(); }
            @Override public Optional<String> adminUsername() { return Optional.empty(); }
            @Override public Optional<String> adminPassword() { return Optional.empty(); }
            @Override public int timeoutSeconds() { return 5; }
        };
        AutenticacaoException semSegredo = assertThrows(
                AutenticacaoException.class,
                () -> client.autenticar("admin@mousetrap.test", "Admin@1234"));
        assertEquals(503, semSegredo.status());
    }
}
