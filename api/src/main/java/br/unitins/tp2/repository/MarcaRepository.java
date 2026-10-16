package br.unitins.tp2.repository;

import br.unitins.tp2.model.Marca;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class MarcaRepository implements PanacheRepository<Marca> {
    public Marca findByNomeExato(String nome) {
        return find("lower(nome) = lower(?1)", nome).firstResult();
    }
}
