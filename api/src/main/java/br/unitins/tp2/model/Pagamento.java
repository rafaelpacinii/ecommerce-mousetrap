package br.unitins.tp2.model;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import jakarta.persistence.*;
@Entity
@Table(name = "pagamento")
public class Pagamento extends DefaultEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "pedido_id", nullable = false)
    private Pedido pedido;
    @Column(name = "chave_idempotencia", nullable = false, unique = true)
    private UUID chaveIdempotencia;
    @Column(nullable = false)
    private FormaPagamento forma;
    @Column(nullable = false)
    private StatusPagamento status;
    @Column(name = "resultado_simulado", nullable = false)
    private ResultadoSimulacao resultadoSimulado;
    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal valor;
    @Column(name = "processado_em")
    private Instant processadoEm;
    @Version @Column(nullable = false)
    private Long versao;

    public Pedido getPedido() { return pedido; }
    public void setPedido(Pedido value) { this.pedido = value; }
    public UUID getChaveIdempotencia() { return chaveIdempotencia; }
    public void setChaveIdempotencia(UUID value) { this.chaveIdempotencia = value; }
    public FormaPagamento getForma() { return forma; }
    public void setForma(FormaPagamento value) { this.forma = value; }
    public StatusPagamento getStatus() { return status; }
    public void setStatus(StatusPagamento value) { this.status = value; }
    public ResultadoSimulacao getResultadoSimulado() { return resultadoSimulado; }
    public void setResultadoSimulado(ResultadoSimulacao value) { this.resultadoSimulado = value; }
    public BigDecimal getValor() { return valor; }
    public void setValor(BigDecimal value) { this.valor = value; }
    public Instant getProcessadoEm() { return processadoEm; }
    public void setProcessadoEm(Instant value) { this.processadoEm = value; }
    public Long getVersao() { return versao; }
    public void setVersao(Long value) { this.versao = value; }
}
