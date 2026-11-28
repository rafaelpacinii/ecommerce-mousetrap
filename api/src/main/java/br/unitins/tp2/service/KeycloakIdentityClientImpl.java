package br.unitins.tp2.service;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import br.unitins.tp2.config.KeycloakAuthConfig;
import br.unitins.tp2.exception.AutenticacaoException;
import br.unitins.tp2.exception.ValidationException;
import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

@ApplicationScoped
public class KeycloakIdentityClientImpl implements KeycloakIdentityClient {
    private static final Logger LOG = Logger.getLogger(KeycloakIdentityClientImpl.class);

    @Inject
    KeycloakAuthConfig config;

    @Inject
    ObjectMapper mapper;

    private HttpClient http;
    private volatile String cachedClientSecret;
    private volatile boolean realmReconciled;

    @PostConstruct
    void init() {
        int timeout = Math.max(2, config.timeoutSeconds());
        this.http = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(timeout))
                .build();
    }

    @Override
    public TokenSet autenticar(String email, String senha) {
        String secret = resolverClientSecret(false);
        HttpResponse<String> response = enviarLoginUsuario(email, senha, secret);
        if (response.statusCode() == 401 && podeUsarCredenciaisAdmin()) {
            // Client secret may have rotated or client was missing in an older dev realm; reconcile once.
            secret = resolverClientSecret(true);
            response = enviarLoginUsuario(email, senha, secret);
        }
        if (response.statusCode() == 400 || response.statusCode() == 401) {
            if (erroConfiguracaoContaOuCliente(response.body()) && podeUsarCredenciaisAdmin()) {
                secret = resolverClientSecret(true);
                response = enviarLoginUsuario(email, senha, secret);
            }
        }
        if (response.statusCode() == 400 || response.statusCode() == 401) {
            throw new AutenticacaoException(401, "Não autorizado", "E-mail ou senha inválidos.");
        }
        if (response.statusCode() != 200) {
            LOG.warnf("Keycloak token exchange returned unexpected HTTP status %d", response.statusCode());
            throw indisponivel();
        }
        return lerTokenSet(response.body());
    }

    private HttpResponse<String> enviarLoginUsuario(String email, String senha, String secret) {
        Map<String, String> form = new LinkedHashMap<>();
        form.put("grant_type", "password");
        form.put("client_id", config.clientId());
        form.put("client_secret", secret);
        form.put("username", email);
        form.put("password", senha);
        form.put("scope", "openid profile email");
        return enviarForm(tokenEndpoint(config.realm()), form, "auth-login");
    }

    @Override
    public TokenSet renovar(String refreshToken) {
        String secret = resolverClientSecret(false);
        Map<String, String> form = new LinkedHashMap<>();
        form.put("grant_type", "refresh_token");
        form.put("client_id", config.clientId());
        form.put("client_secret", secret);
        form.put("refresh_token", refreshToken);

        HttpResponse<String> response = enviarForm(tokenEndpoint(config.realm()), form, "auth-refresh");
        if (response.statusCode() == 400 || response.statusCode() == 401) {
            throw new AutenticacaoException(
                    401, "Sessão expirada", "Sua sessão terminou. Entre novamente para continuar.");
        }
        if (response.statusCode() != 200) {
            LOG.warnf("Keycloak token refresh returned unexpected HTTP status %d", response.statusCode());
            throw indisponivel();
        }
        return lerTokenSet(response.body());
    }

    @Override
    public void encerrarSessao(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            return;
        }
        String secret = obterSecretDisponivelSemFalhar();
        if (secret == null) {
            return;
        }
        Map<String, String> form = new LinkedHashMap<>();
        form.put("client_id", config.clientId());
        form.put("client_secret", secret);
        form.put("refresh_token", refreshToken);
        try {
            HttpResponse<String> response = enviarForm(logoutEndpoint(config.realm()), form, "auth-logout");
            if (response.statusCode() >= 500) {
                LOG.warnf("Keycloak session logout returned HTTP status %d", response.statusCode());
            }
        } catch (AutenticacaoException ignored) {
            // Local session cookie cleanup still proceeds if identity provider is unreachable.
        }
    }

    @Override
    public String criarUsuarioCliente(String nome, String email, String senha) {
        String adminToken = obterTokenAdministrativo();
        String[] partesNome = separarNome(nome);
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("username", email);
        payload.put("email", email);
        payload.put("firstName", partesNome[0]);
        payload.put("lastName", partesNome[1]);
        payload.put("enabled", true);
        payload.put("emailVerified", true);
        payload.put("requiredActions", List.of());
        payload.put(
                "credentials",
                List.of(Map.of("type", "password", "value", senha, "temporary", false)));

        HttpResponse<String> createResp = enviarJson(
                "POST", adminRealmBase() + "/users", adminToken, payload, "admin-create-user");
        if (createResp.statusCode() == 409) {
            throw new AutenticacaoException(
                    409, "Conta já existente", "Já existe uma conta cadastrada com este e-mail.");
        }
        if (createResp.statusCode() == 400) {
            throw new ValidationException(
                    "senha", "A senha não atende aos critérios de segurança exigidos.");
        }
        if (createResp.statusCode() != 201) {
            LOG.warnf("Keycloak user creation returned HTTP status %d", createResp.statusCode());
            throw indisponivel();
        }
        String location = createResp.headers().firstValue("Location").orElse("");
        int barra = location.lastIndexOf('/');
        String userId = barra >= 0 ? location.substring(barra + 1).strip() : "";
        if (userId.isEmpty()) {
            throw indisponivel();
        }
        try {
            atribuirPapelCustomer(adminToken, userId);
            return userId;
        } catch (RuntimeException erro) {
            removerUsuarioComToken(adminToken, userId);
            throw erro;
        }
    }

    @Override
    public void removerUsuario(String userId) {
        if (userId == null || userId.isBlank()) {
            return;
        }
        try {
            String adminToken = obterTokenAdministrativo();
            removerUsuarioComToken(adminToken, userId);
        } catch (RuntimeException erro) {
            LOG.warn("Could not roll back Keycloak user after local persistence failure");
        }
    }

    private void atribuirPapelCustomer(String adminToken, String userId) {
        HttpResponse<String> roleResp = enviarSemCorpo(
                "GET", adminRealmBase() + "/roles/customer", adminToken, "admin-read-role");
        if (roleResp.statusCode() != 200) {
            LOG.warnf("Keycloak customer role lookup returned HTTP status %d", roleResp.statusCode());
            throw indisponivel();
        }
        try {
            JsonNode roleNode = mapper.readTree(roleResp.body());
            HttpResponse<String> mapResp = enviarJson(
                    "POST",
                    adminRealmBase() + "/users/" + encodePath(userId) + "/role-mappings/realm",
                    adminToken,
                    List.of(roleNode),
                    "admin-assign-role");
            if (mapResp.statusCode() < 200 || mapResp.statusCode() >= 300) {
                LOG.warnf("Keycloak customer role assignment returned HTTP status %d", mapResp.statusCode());
                throw indisponivel();
            }
        } catch (IOException erro) {
            throw indisponivel();
        }
    }

    private void removerUsuarioComToken(String adminToken, String userId) {
        HttpResponse<String> resp = enviarSemCorpo(
                "DELETE",
                adminRealmBase() + "/users/" + encodePath(userId),
                adminToken,
                "admin-delete-user");
        if (resp.statusCode() >= 400 && resp.statusCode() != 404) {
            LOG.warnf("Keycloak compensating user deletion returned HTTP status %d", resp.statusCode());
        }
    }

    private String obterTokenAdministrativo() {
        String secret = config.clientSecret().map(String::strip).filter(s -> !s.isEmpty()).orElse(cachedClientSecret);
        if (secret != null && !secret.isBlank()) {
            Map<String, String> form = new LinkedHashMap<>();
            form.put("grant_type", "client_credentials");
            form.put("client_id", config.clientId());
            form.put("client_secret", secret);
            HttpResponse<String> resp = enviarForm(tokenEndpoint(config.realm()), form, "admin-service-token");
            if (resp.statusCode() == 200) {
                return lerTokenSet(resp.body()).accessToken();
            }
            LOG.warnf("Service-account token request returned HTTP status %d; checking master admin fallback", resp.statusCode());
        }
        String masterToken = autenticarAdminMaster();
        reconciliarRealmEClienteSeNecessario(masterToken);
        return masterToken;
    }

    private String resolverClientSecret(boolean forcarReconciliacao) {
        if (!forcarReconciliacao) {
            String configurado = config.clientSecret().map(String::strip).filter(s -> !s.isEmpty()).orElse(null);
            if (configurado != null) {
                return configurado;
            }
            if (cachedClientSecret != null && !cachedClientSecret.isBlank()) {
                return cachedClientSecret;
            }
        }
        if (podeUsarCredenciaisAdmin()) {
            String masterToken = autenticarAdminMaster();
            reconciliarRealmEClienteSeNecessario(masterToken);
            if (cachedClientSecret != null && !cachedClientSecret.isBlank()) {
                return cachedClientSecret;
            }
        }
        LOG.warn("Keycloak client secret is missing (KEYCLOAK_CLIENT_SECRET) and master admin credentials are not configured.");
        throw indisponivel();
    }

    private String obterSecretDisponivelSemFalhar() {
        String configurado = config.clientSecret().map(String::strip).filter(s -> !s.isEmpty()).orElse(null);
        return configurado != null ? configurado : cachedClientSecret;
    }

    private boolean podeUsarCredenciaisAdmin() {
        return config.adminUsername().map(String::strip).filter(s -> !s.isEmpty()).isPresent()
                && config.adminPassword().filter(s -> !s.isBlank()).isPresent();
    }

    private String autenticarAdminMaster() {
        String adminUser = config.adminUsername().map(String::strip).filter(s -> !s.isEmpty()).orElse(null);
        String adminPass = config.adminPassword().filter(s -> !s.isBlank()).orElse(null);
        if (adminUser == null || adminPass == null) {
            LOG.warn("Neither KEYCLOAK_CLIENT_SECRET nor KEYCLOAK_ADMIN / KEYCLOAK_ADMIN_PASSWORD is configured.");
            throw indisponivel();
        }
        Map<String, String> form = new LinkedHashMap<>();
        form.put("grant_type", "password");
        form.put("client_id", "admin-cli");
        form.put("username", adminUser);
        form.put("password", adminPass);
        HttpResponse<String> resp = enviarForm(tokenEndpoint("master"), form, "admin-fallback-token");
        if (resp.statusCode() != 200) {
            LOG.warnf(
                    "Keycloak rejected master admin credentials (HTTP %d). Check KEYCLOAK_ADMIN / KEYCLOAK_ADMIN_PASSWORD in .env or set KEYCLOAK_CLIENT_SECRET.",
                    resp.statusCode());
            throw indisponivel();
        }
        return lerTokenSet(resp.body()).accessToken();
    }

    private synchronized void reconciliarRealmEClienteSeNecessario(String masterToken) {
        try {
            if (!realmReconciled) {
                atualizarPoliticasRealm(masterToken);
                realmReconciled = true;
            }
            String clientUuid = localizarOuCriarClienteBackend(masterToken);
            HttpResponse<String> secretResp = enviarSemCorpo(
                    "GET",
                    adminRealmBase() + "/clients/" + encodePath(clientUuid) + "/client-secret",
                    masterToken,
                    "admin-read-client-secret");
            if (secretResp.statusCode() == 200) {
                String valor = mapper.readTree(secretResp.body()).path("value").asText("").strip();
                if (!valor.isEmpty()) {
                    this.cachedClientSecret = valor;
                }
            }
        } catch (IOException erro) {
            LOG.warn("Could not parse Keycloak admin response while reconciling backend client");
        }
    }

    private void atualizarPoliticasRealm(String masterToken) throws IOException {
        HttpResponse<String> realmResp = enviarSemCorpo(
                "GET", adminRealmBase(), masterToken, "admin-read-realm");
        if (realmResp.statusCode() != 200) {
            return;
        }
        JsonNode node = mapper.readTree(realmResp.body());
        if (!(node instanceof ObjectNode realmObj)) {
            return;
        }
        boolean verifyEmail = realmObj.path("verifyEmail").asBoolean(false);
        String policy = realmObj.path("passwordPolicy").asText("");
        if (verifyEmail || policy.contains("length(12)")) {
            realmObj.put("verifyEmail", false);
            realmObj.put("passwordPolicy", "length(8) and digits(1) and upperCase(1) and lowerCase(1)");
            enviarJson("PUT", adminRealmBase(), masterToken, realmObj, "admin-update-realm");
        }
    }

    private String localizarOuCriarClienteBackend(String masterToken) throws IOException {
        String queryUrl = adminRealmBase() + "/clients?clientId=" + encodePath(config.clientId());
        HttpResponse<String> listResp = enviarSemCorpo("GET", queryUrl, masterToken, "admin-find-client");
        if (listResp.statusCode() == 200) {
            JsonNode arr = mapper.readTree(listResp.body());
            if (arr.isArray() && !arr.isEmpty()) {
                JsonNode existing = arr.get(0);
                String uuid = existing.path("id").asText("");
                if (!existing.path("directAccessGrantsEnabled").asBoolean(false)
                        || !existing.path("serviceAccountsEnabled").asBoolean(false)) {
                    if (existing instanceof ObjectNode obj) {
                        obj.put("publicClient", false);
                        obj.put("directAccessGrantsEnabled", true);
                        obj.put("serviceAccountsEnabled", true);
                        enviarJson(
                                "PUT",
                                adminRealmBase() + "/clients/" + encodePath(uuid),
                                masterToken,
                                obj,
                                "admin-update-client");
                    }
                }
                garantirPapeisServiceAccount(masterToken, uuid);
                return uuid;
            }
        }

        Map<String, Object> novoCliente = new LinkedHashMap<>();
        novoCliente.put("clientId", config.clientId());
        novoCliente.put("name", "MouseTrap Backend Auth Service");
        novoCliente.put("enabled", true);
        novoCliente.put("protocol", "openid-connect");
        novoCliente.put("publicClient", false);
        novoCliente.put("clientAuthenticatorType", "client-secret");
        novoCliente.put("standardFlowEnabled", false);
        novoCliente.put("implicitFlowEnabled", false);
        novoCliente.put("directAccessGrantsEnabled", true);
        novoCliente.put("serviceAccountsEnabled", true);
        novoCliente.put("defaultClientScopes", List.of("basic", "acr", "roles", "profile", "email"));
        novoCliente.put("fullScopeAllowed", true);
        novoCliente.put(
                "protocolMappers",
                List.of(Map.of(
                        "name", "mousetrap-api-audience",
                        "protocol", "openid-connect",
                        "protocolMapper", "oidc-audience-mapper",
                        "config", Map.of(
                                "included.client.audience", "mousetrap-api",
                                "id.token.claim", "false",
                                "access.token.claim", "true"))));

        HttpResponse<String> createResp = enviarJson(
                "POST", adminRealmBase() + "/clients", masterToken, novoCliente, "admin-create-client");
        if (createResp.statusCode() != 201) {
            LOG.warnf("Keycloak backend client creation returned HTTP %d", createResp.statusCode());
            throw indisponivel();
        }
        HttpResponse<String> reloadResp = enviarSemCorpo("GET", queryUrl, masterToken, "admin-reload-client");
        JsonNode reloaded = mapper.readTree(reloadResp.body());
        if (!reloaded.isArray() || reloaded.isEmpty()) {
            throw indisponivel();
        }
        String uuid = reloaded.get(0).path("id").asText("");
        garantirPapeisServiceAccount(masterToken, uuid);
        return uuid;
    }

    private void garantirPapeisServiceAccount(String masterToken, String clientUuid) throws IOException {
        HttpResponse<String> saUserResp = enviarSemCorpo(
                "GET",
                adminRealmBase() + "/clients/" + encodePath(clientUuid) + "/service-account-user",
                masterToken,
                "admin-sa-user");
        HttpResponse<String> rmClientResp = enviarSemCorpo(
                "GET",
                adminRealmBase() + "/clients?clientId=realm-management",
                masterToken,
                "admin-rm-client");
        if (saUserResp.statusCode() != 200 || rmClientResp.statusCode() != 200) {
            return;
        }
        String saUserId = mapper.readTree(saUserResp.body()).path("id").asText("");
        JsonNode rmArr = mapper.readTree(rmClientResp.body());
        if (saUserId.isEmpty() || !rmArr.isArray() || rmArr.isEmpty()) {
            return;
        }
        String rmUuid = rmArr.get(0).path("id").asText("");
        HttpResponse<String> rolesResp = enviarSemCorpo(
                "GET",
                adminRealmBase() + "/clients/" + encodePath(rmUuid) + "/roles",
                masterToken,
                "admin-rm-roles");
        if (rolesResp.statusCode() != 200) {
            return;
        }
        List<JsonNode> desejadas = new ArrayList<>();
        for (JsonNode r : mapper.readTree(rolesResp.body())) {
            String name = r.path("name").asText("");
            if (List.of("manage-users", "view-users", "query-users", "view-realm").contains(name)) {
                desejadas.add(r);
            }
        }
        if (!desejadas.isEmpty()) {
            enviarJson(
                    "POST",
                    adminRealmBase()
                            + "/users/" + encodePath(saUserId)
                            + "/role-mappings/clients/" + encodePath(rmUuid),
                    masterToken,
                    desejadas,
                    "admin-sa-assign-roles");
        }
    }

    private boolean erroConfiguracaoContaOuCliente(String body) {
        if (body == null || body.isBlank()) {
            return false;
        }
        return body.contains("unauthorized_client")
                || body.contains("invalid_client")
                || body.contains("Account is not fully set up");
    }

    private TokenSet lerTokenSet(String body) {
        try {
            JsonNode json = mapper.readTree(body);
            String accessToken = json.path("access_token").asText("");
            String refreshToken = json.path("refresh_token").asText("");
            long expiresIn = json.path("expires_in").asLong(300L);
            long refreshExpiresIn = json.path("refresh_expires_in").asLong(1800L);
            if (accessToken.isBlank()) {
                throw indisponivel();
            }
            return new TokenSet(accessToken, refreshToken, expiresIn, refreshExpiresIn);
        } catch (IOException erro) {
            throw indisponivel();
        }
    }

    private HttpResponse<String> enviarForm(URI uri, Map<String, String> fields, String operation) {
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, String> entry : fields.entrySet()) {
            if (!sb.isEmpty()) {
                sb.append('&');
            }
            sb.append(URLEncoder.encode(entry.getKey(), StandardCharsets.UTF_8))
                    .append('=')
                    .append(URLEncoder.encode(entry.getValue(), StandardCharsets.UTF_8));
        }
        HttpRequest request = HttpRequest.newBuilder(uri)
                .timeout(Duration.ofSeconds(Math.max(2, config.timeoutSeconds())))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .header("Accept", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(sb.toString()))
                .build();
        return executar(request, operation);
    }

    private HttpResponse<String> enviarJson(
            String method, String url, String bearerToken, Object body, String operation) {
        try {
            String payload = mapper.writeValueAsString(body);
            HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                    .timeout(Duration.ofSeconds(Math.max(2, config.timeoutSeconds())))
                    .header("Authorization", "Bearer " + bearerToken)
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .method(method, HttpRequest.BodyPublishers.ofString(payload))
                    .build();
            return executar(request, operation);
        } catch (IOException erro) {
            throw indisponivel();
        }
    }

    private HttpResponse<String> enviarSemCorpo(
            String method, String url, String bearerToken, String operation) {
        HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                .timeout(Duration.ofSeconds(Math.max(2, config.timeoutSeconds())))
                .header("Authorization", "Bearer " + bearerToken)
                .header("Accept", "application/json")
                .method(method, HttpRequest.BodyPublishers.noBody())
                .build();
        return executar(request, operation);
    }

    private HttpResponse<String> executar(HttpRequest request, String operation) {
        try {
            return http.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        } catch (InterruptedException erro) {
            Thread.currentThread().interrupt();
            LOG.warnf("Keycloak operation %s was interrupted", operation);
            throw indisponivel();
        } catch (IOException erro) {
            LOG.warnf("Keycloak operation %s failed due to upstream connectivity error", operation);
            throw indisponivel();
        }
    }

    private String baseUrl() {
        String raw = config.serverUrl().strip();
        return raw.endsWith("/") ? raw.substring(0, raw.length() - 1) : raw;
    }

    private URI tokenEndpoint(String realm) {
        return URI.create(baseUrl() + "/realms/" + encodePath(realm) + "/protocol/openid-connect/token");
    }

    private URI logoutEndpoint(String realm) {
        return URI.create(baseUrl() + "/realms/" + encodePath(realm) + "/protocol/openid-connect/logout");
    }

    private String adminRealmBase() {
        return baseUrl() + "/admin/realms/" + encodePath(config.realm());
    }

    private static String encodePath(String segment) {
        return URLEncoder.encode(segment, StandardCharsets.UTF_8).replace("+", "%20");
    }

    private static String[] separarNome(String nomeCompleto) {
        String limpo = nomeCompleto == null ? "" : nomeCompleto.strip();
        int espaco = limpo.indexOf(' ');
        if (espaco < 0) {
            return new String[] { limpo, "Cliente" };
        }
        String primeiro = limpo.substring(0, espaco).strip();
        String restante = limpo.substring(espaco + 1).strip();
        return new String[] { primeiro, restante.isEmpty() ? "Cliente" : restante };
    }

    private static AutenticacaoException indisponivel() {
        return new AutenticacaoException(
                503,
                "Serviço indisponível",
                "Não foi possível conectar ao serviço de autenticação no momento. Tente novamente em instantes.");
    }
}
