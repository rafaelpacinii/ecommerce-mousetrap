package br.unitins.tp2.repository;
import br.unitins.tp2.model.Desejo;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
@ApplicationScoped public class DesejoRepository implements PanacheRepository<Desejo>{}
