package br.unitins.tp2.repository;

import java.util.Locale;
import br.unitins.tp2.model.Transportadora;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class TransportadoraRepository implements PanacheRepository<Transportadora> {
    public Transportadora findByNomeExato(String nome) {
        if (nome == null || nome.isBlank())
            return null;
        return find("lower(nome)", nome.strip().toLowerCase(Locale.ROOT)).firstResult();
    }
}

