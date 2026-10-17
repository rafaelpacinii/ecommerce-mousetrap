package br.unitins.tp2.repository;
import java.time.Instant;
import java.util.*;
import br.unitins.tp2.model.*;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
@ApplicationScoped
public class PedidoRepository implements PanacheRepository<Pedido> {
    public Pedido findByChave(UUID chave) { return find("chaveCheckout", chave).firstResult(); }
    public List<Long> vencidos(Instant agora) { return find("status = ?1 and expiraEm <= ?2 order by id", StatusPedido.AGUARDANDO_PAGAMENTO, agora)
        .page(0, 100).list().stream().map(Pedido::getId).toList(); }
}
