package br.unitins.tp2.repository;
import br.unitins.tp2.model.Cliente;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
@ApplicationScoped
public class ClienteRepository implements PanacheRepository<Cliente> {
    public Cliente findByIdentidadeSubject(String subject) {
        return find("identidadeSubject", subject).firstResult();
    }
    public Cliente findByEmail(String email) {
        return find("email", email).firstResult();
    }
}
