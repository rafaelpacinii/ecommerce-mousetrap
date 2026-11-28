package br.unitins.tp2.resource;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import io.quarkus.test.common.QuarkusTestResourceLifecycleManager;

public class KeycloakTestResource implements QuarkusTestResourceLifecycleManager {
    private static final String SECRET = "test-backend-secret";
    private static final String SERVICE_TOKEN = "service-account-admin-token";

    private HttpServer server;
    private final ObjectMapper mapper = new ObjectMapper();
    private final Map<String, FakeUser> usersById = new ConcurrentHashMap<>();
    private final Map<String, FakeUser> usersByEmail = new ConcurrentHashMap<>();
    private final Map<String, String> refreshToUserId = new ConcurrentHashMap<>();
    private final Set<String> revokedRefreshTokens = ConcurrentHashMap.newKeySet();

    private static final class FakeUser {
        final String id;
        final String email;
        final String name;
        final String password;
        final boolean enabled;
        final boolean emailVerified;
        final List<String> roles = new ArrayList<>();

        FakeUser(
                String id,
                String email,
                String name,
                String password,
                boolean enabled,
                boolean emailVerified,
                List<String> initialRoles) {
            this.id = id;
            this.email = email;
            this.name = name;
            this.password = password;
            this.enabled = enabled;
            this.emailVerified = emailVerified;
            this.roles.addAll(initialRoles);
        }
    }

    @Override
    public Map<String, String> start() {
        try {
            seedDefaults();
            server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
            int port = server.getAddress().getPort();
            server.createContext("/realms/mousetrap/protocol/openid-connect/token", this::handleToken);
            server.createContext("/realms/mousetrap/protocol/openid-connect/logout", this::handleLogout);
            server.createContext(
                    "/admin/realms/mousetrap/roles/customer",
                    ex -> {
                        if (!autorizadoAdmin(ex)) return;
                        responderJson(ex, 200, Map.of("id", "role-customer", "name", "customer"));
                    });
            server.createContext("/admin/realms/mousetrap/users", ex -> handleAdminUsers(ex, port));
            server.start();
            return Map.of(
                    "keycloak.server-url", "http://127.0.0.1:" + port,
                    "keycloak.realm", "mousetrap",
                    "keycloak.client-id", "mousetrap-backend",
                    "keycloak.client-secret", SECRET);
        } catch (IOException e) {
            throw new IllegalStateException(e);
        }
    }

    private void seedDefaults() {
        FakeUser admin = new FakeUser(
                "kc-admin-1",
                "admin@mousetrap.test",
                "Operadora Admin",
                "Admin@1234",
                true,
                true,
                List.of("admin", "customer"));
        usersById.put(admin.id, admin);
        usersByEmail.put(admin.email, admin);

        FakeUser semPapel = new FakeUser(
                "kc-norole-1",
                "semrole@mousetrap.test",
                "Usuário Sem Papel",
                "SemRole@1234",
                true,
                true,
                List.of());
        usersById.put(semPapel.id, semPapel);
        usersByEmail.put(semPapel.email, semPapel);
    }

    private void handleToken(HttpExchange ex) throws IOException {
        Map<String, String> form = lerForm(ex);
        if (!"mousetrap-backend".equals(form.get("client_id"))
                || !SECRET.equals(form.get("client_secret"))) {
            responderJson(ex, 401, Map.of("error", "unauthorized_client"));
            return;
        }
        String grant = form.getOrDefault("grant_type", "");
        if ("client_credentials".equals(grant)) {
            responderJson(ex, 200, Map.of("access_token", SERVICE_TOKEN, "expires_in", 300));
            return;
        }
        if ("password".equals(grant)) {
            String email = form.getOrDefault("username", "").strip().toLowerCase(Locale.ROOT);
            String senha = form.getOrDefault("password", "");
            FakeUser user = usersByEmail.get(email);
            if (user == null || !user.enabled || !user.emailVerified || !user.password.equals(senha)) {
                responderJson(ex, 401, Map.of("error", "invalid_grant"));
                return;
            }
            emitirTokens(ex, user);
            return;
        }
        if ("refresh_token".equals(grant)) {
            String rt = form.getOrDefault("refresh_token", "");
            if (rt.isEmpty() || revokedRefreshTokens.contains(rt)) {
                responderJson(ex, 400, Map.of("error", "invalid_grant"));
                return;
            }
            String userId = refreshToUserId.remove(rt);
            FakeUser user = userId == null ? null : usersById.get(userId);
            if (user == null || !user.enabled) {
                responderJson(ex, 400, Map.of("error", "invalid_grant"));
                return;
            }
            revokedRefreshTokens.add(rt);
            emitirTokens(ex, user);
            return;
        }
        responderJson(ex, 400, Map.of("error", "unsupported_grant_type"));
    }

    private void handleLogout(HttpExchange ex) throws IOException {
        Map<String, String> form = lerForm(ex);
        if (!"mousetrap-backend".equals(form.get("client_id"))
                || !SECRET.equals(form.get("client_secret"))) {
            responderJson(ex, 401, Map.of("error", "unauthorized_client"));
            return;
        }
        String rt = form.getOrDefault("refresh_token", "");
        if (!rt.isEmpty()) {
            revokedRefreshTokens.add(rt);
            refreshToUserId.remove(rt);
        }
        ex.sendResponseHeaders(204, -1);
        ex.close();
    }

    private void handleAdminUsers(HttpExchange ex, int port) throws IOException {
        if (!autorizadoAdmin(ex)) return;
        String path = ex.getRequestURI().getPath();
        String method = ex.getRequestMethod();
        if ("POST".equals(method) && "/admin/realms/mousetrap/users".equals(path)) {
            JsonNode body = mapper.readTree(ex.getRequestBody());
            String email = body.path("email").asText("").strip().toLowerCase(Locale.ROOT);
            boolean enabled = body.path("enabled").asBoolean(false);
            boolean verified = body.path("emailVerified").asBoolean(false);
            String firstName = body.path("firstName").asText("");
            String lastName = body.path("lastName").asText("");
            String password = body.path("credentials").path(0).path("value").asText("");
            if (!enabled || !verified || password.length() < 8) {
                responderJson(ex, 400, Map.of("errorMessage", "Invalid user representation"));
                return;
            }
            if (usersByEmail.containsKey(email)) {
                responderJson(ex, 409, Map.of("errorMessage", "User exists with same email"));
                return;
            }
            String id = "kc-user-" + UUID.randomUUID();
            String fullName = (firstName + " " + lastName).strip();
            FakeUser created = new FakeUser(id, email, fullName, password, true, true, List.of());
            usersById.put(id, created);
            usersByEmail.put(email, created);
            ex.getResponseHeaders().add(
                    "Location", "http://127.0.0.1:" + port + "/admin/realms/mousetrap/users/" + id);
            ex.sendResponseHeaders(201, -1);
            ex.close();
            return;
        }
        if ("POST".equals(method) && path.endsWith("/role-mappings/realm")) {
            String prefix = "/admin/realms/mousetrap/users/";
            String suffix = "/role-mappings/realm";
            String userId = path.substring(prefix.length(), path.length() - suffix.length());
            FakeUser user = usersById.get(userId);
            if (user == null) {
                ex.sendResponseHeaders(404, -1);
                ex.close();
                return;
            }
            JsonNode roles = mapper.readTree(ex.getRequestBody());
            for (JsonNode r : roles) {
                String roleName = r.path("name").asText("");
                if (!roleName.isEmpty() && !user.roles.contains(roleName)) {
                    user.roles.add(roleName);
                }
            }
            ex.sendResponseHeaders(204, -1);
            ex.close();
            return;
        }
        if ("DELETE".equals(method) && path.startsWith("/admin/realms/mousetrap/users/")) {
            String userId = path.substring("/admin/realms/mousetrap/users/".length());
            FakeUser removed = usersById.remove(userId);
            if (removed != null) {
                usersByEmail.remove(removed.email);
            }
            ex.sendResponseHeaders(204, -1);
            ex.close();
            return;
        }
        ex.sendResponseHeaders(404, -1);
        ex.close();
    }

    private void emitirTokens(HttpExchange ex, FakeUser user) throws IOException {
        String header = Base64.getUrlEncoder().withoutPadding()
                .encodeToString("{\"alg\":\"RS256\",\"typ\":\"JWT\"}".getBytes(StandardCharsets.UTF_8));
        Map<String, Object> claims = Map.of(
                "sub", user.id,
                "email", user.email,
                "email_verified", user.emailVerified,
                "name", user.name,
                "preferred_username", user.email,
                "aud", "mousetrap-api",
                "realm_access", Map.of("roles", List.copyOf(user.roles)));
        String payload = Base64.getUrlEncoder().withoutPadding()
                .encodeToString(mapper.writeValueAsBytes(claims));
        String accessToken = header + "." + payload + ".test-signature";
        String refreshToken = "rt-" + UUID.randomUUID();
        refreshToUserId.put(refreshToken, user.id);
        responderJson(
                ex,
                200,
                Map.of(
                        "access_token", accessToken,
                        "refresh_token", refreshToken,
                        "expires_in", 300,
                        "refresh_expires_in", 1800));
    }

    private boolean autorizadoAdmin(HttpExchange ex) throws IOException {
        String auth = ex.getRequestHeaders().getFirst("Authorization");
        if (!("Bearer " + SERVICE_TOKEN).equals(auth)) {
            responderJson(ex, 401, Map.of("error", "invalid_token"));
            return false;
        }
        return true;
    }

    private Map<String, String> lerForm(HttpExchange ex) throws IOException {
        String raw = new String(ex.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
        Map<String, String> result = new HashMap<>();
        for (String pair : raw.split("&")) {
            if (pair.isEmpty()) continue;
            int idx = pair.indexOf('=');
            if (idx < 0) continue;
            result.put(
                    URLDecoder.decode(pair.substring(0, idx), StandardCharsets.UTF_8),
                    URLDecoder.decode(pair.substring(idx + 1), StandardCharsets.UTF_8));
        }
        return result;
    }

    private void responderJson(HttpExchange ex, int status, Object payload) throws IOException {
        byte[] bytes = mapper.writeValueAsBytes(payload);
        ex.getResponseHeaders().add("Content-Type", "application/json");
        ex.sendResponseHeaders(status, bytes.length);
        try (var out = ex.getResponseBody()) {
            out.write(bytes);
        }
    }

    @Override
    public void stop() {
        if (server != null) {
            server.stop(0);
        }
    }
}
