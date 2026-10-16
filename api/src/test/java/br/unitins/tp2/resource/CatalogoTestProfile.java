package br.unitins.tp2.resource;

import java.util.Map;
import io.quarkus.test.junit.QuarkusTestProfile;

public class CatalogoTestProfile implements QuarkusTestProfile {
    @Override
    public Map<String, String> getConfigOverrides() {
        return Map.ofEntries(
                Map.entry("quarkus.datasource.jdbc.url", "jdbc:postgresql://localhost:55439/ecommerce_test"),
                Map.entry("quarkus.datasource.username", "ecommerce_test"),
                Map.entry("quarkus.datasource.password", "ecommerce_test"),
                Map.entry("quarkus.datasource.db-kind", "postgresql"),
                Map.entry("quarkus.devservices.enabled", "false"),
                Map.entry("quarkus.flyway.migrate-at-start", "true"),
                Map.entry("quarkus.hibernate-orm.schema-management.strategy", "validate"),
                Map.entry("quarkus.hibernate-orm.sql-load-script", "no-file"),
                Map.entry("quarkus.hibernate-orm.log.sql", "false"),
                Map.entry("quarkus.hibernate-orm.log.bind-parameters", "false"));
    }
}
