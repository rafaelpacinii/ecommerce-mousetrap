package br.unitins.tp2.repository;

import java.util.Locale;
import br.unitins.tp2.model.SwitchMouse;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class SwitchMouseRepository implements PanacheRepository<SwitchMouse> {
    public SwitchMouse findByModeloExato(String modelo) {
        if (modelo == null || modelo.isBlank())
            return null;
        return find("lower(modelo)", modelo.strip().toLowerCase(Locale.ROOT)).firstResult();
    }
}

