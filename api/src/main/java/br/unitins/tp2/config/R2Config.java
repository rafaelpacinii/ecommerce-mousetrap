package br.unitins.tp2.config;

import java.util.Optional;
import io.smallrye.config.ConfigMapping;
import io.smallrye.config.WithDefault;

@ConfigMapping(prefix = "storage.r2")
public interface R2Config {
    @WithDefault("false") boolean enabled();
    Optional<String> endpoint();
    Optional<String> bucket();
    Optional<String> accessKeyId();
    Optional<String> secretAccessKey();
    Optional<String> publicUrl();
}
