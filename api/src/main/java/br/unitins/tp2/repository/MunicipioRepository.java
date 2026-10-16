package br.unitins.tp2.repository;

import br.unitins.tp2.model.Municipio;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class MunicipioRepository implements PanacheRepository<Municipio> {
    public Municipio findByCodigoIbge(String codigoIbge) {
        return find("codigoIbge", codigoIbge).firstResult();
    }

    public void inserirSeAusente(String nome, String codigoIbge, Long idEstado) {
        // O índice único protege também contra cadastros concorrentes.
        getEntityManager().createNativeQuery("""
                INSERT INTO municipio (nome, codigo_ibge, estado_id, data_cadastro)
                VALUES (?1, ?2, ?3, CURRENT_TIMESTAMP)
                ON CONFLICT (codigo_ibge) DO NOTHING
                """)
                .setParameter(1, nome).setParameter(2, codigoIbge).setParameter(3, idEstado)
                .executeUpdate();
    }
}
