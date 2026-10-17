package br.unitins.tp2.repository;
import java.util.UUID;
import br.unitins.tp2.model.Pagamento;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
@ApplicationScoped
public class PagamentoRepository implements PanacheRepository<Pagamento> {
    public Pagamento findByChave(UUID chave) { return find("chaveIdempotencia", chave).firstResult(); }
}
