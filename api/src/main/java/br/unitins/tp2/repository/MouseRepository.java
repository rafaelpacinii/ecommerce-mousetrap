package br.unitins.tp2.repository;

import br.unitins.tp2.model.Mouse;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import io.quarkus.hibernate.orm.panache.PanacheQuery;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class MouseRepository implements PanacheRepository<Mouse> {
    public Mouse findBySku(String sku) {
        return find("sku", sku).firstResult();
    }

    public PanacheQuery<Mouse> findByNome(String nome) {
        return find("lower(nome) like ?1 order by nome", "%" + nome.toLowerCase() + "%");
    }

    @Override
    public PanacheQuery<Mouse> findAll() {
        return find("order by nome");
    }

    public boolean existePorMarca(Long idMarca) {
        return count("marca.id", idMarca) > 0;
    }
}
