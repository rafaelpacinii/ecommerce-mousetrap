package br.unitins.tp2.repository;

import br.unitins.tp2.model.Mouse;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class MouseRepository implements PanacheRepository<Mouse> {
    public Mouse findBySku(String sku) {
        return find("sku", sku).firstResult();
    }

    public boolean existePorMarca(Long idMarca) {
        return count("marca.id", idMarca) > 0;
    }
}
