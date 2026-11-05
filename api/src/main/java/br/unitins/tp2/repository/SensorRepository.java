package br.unitins.tp2.repository;

import java.util.Locale;
import br.unitins.tp2.model.Sensor;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class SensorRepository implements PanacheRepository<Sensor> {
    public Sensor findByModeloExato(String modelo) {
        if (modelo == null || modelo.isBlank())
            return null;
        return find("lower(modelo)", modelo.strip().toLowerCase(Locale.ROOT)).firstResult();
    }
}

