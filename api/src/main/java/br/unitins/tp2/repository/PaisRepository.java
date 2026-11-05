package br.unitins.tp2.repository;

import java.util.Locale;
import br.unitins.tp2.model.Pais;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class PaisRepository implements PanacheRepository<Pais> {
    public Pais findBySiglaIso(String siglaIso) {
        if (siglaIso == null)
            return null;
        return find("siglaIso", siglaIso.strip().toUpperCase(Locale.ROOT)).firstResult();
    }
}

