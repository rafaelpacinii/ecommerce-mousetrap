package br.unitins.tp2.config;

import java.util.Optional;
import io.smallrye.config.ConfigMapping;
import io.smallrye.config.WithDefault;

@ConfigMapping(prefix = "keycloak")
public interface KeycloakAuthConfig {
    @WithDefault("http://localhost:8180")
    String serverUrl();

    @WithDefault("mousetrap")
    String realm();

    @WithDefault("mousetrap-backend")
    String clientId();

    Optional<String> clientSecret();

    Optional<String> adminUsername();

    Optional<String> adminPassword();

    @WithDefault("10")
    int timeoutSeconds();
}
