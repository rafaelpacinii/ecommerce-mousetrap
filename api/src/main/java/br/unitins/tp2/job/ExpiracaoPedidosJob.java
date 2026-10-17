package br.unitins.tp2.job;
import br.unitins.tp2.service.PedidoService;
import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
@ApplicationScoped
public class ExpiracaoPedidosJob {
    @Inject PedidoService pedidos;
    @Scheduled(every = "${pedidos.expiracao.intervalo:30s}", concurrentExecution = Scheduled.ConcurrentExecution.SKIP)
    void expirar() { pedidos.expirarVencidos(); }
}
