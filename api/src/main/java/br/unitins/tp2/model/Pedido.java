package br.unitins.tp2.model;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import jakarta.persistence.*;
@Entity
@Table(name = "pedido")
public class Pedido extends DefaultEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;
    @Column(name = "chave_checkout", nullable = false, unique = true)
    private UUID chaveCheckout;
    @Column(name = "requisicao_hash", nullable = false, length = 64)
    private String requisicaoHash;
    @Column(nullable = false)
    private StatusPedido status;
    @Column(name = "criado_em", nullable = false)
    private Instant criadoEm;
    @Column(name = "expira_em", nullable = false)
    private Instant expiraEm;
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal frete;
    @Column(name = "prazo_dias_uteis", nullable = false)
    private Integer prazoDiasUteis;
    @Embedded
    private EnderecoEntrega endereco;
    @Column(length=100) private String transportadora;
    @Column(name="codigo_rastreio",length=80) private String codigoRastreio;
    @Column(name="enviado_em") private Instant enviadoEm;
    @Column(name="entregue_em") private Instant entregueEm;
    @OneToMany(mappedBy="pedido",cascade=CascadeType.PERSIST) @OrderBy("ocorridoEm ASC, id ASC")
    private List<EventoPedido> eventos = new ArrayList<>();
    public List<EventoPedido> getEventos(){return eventos;}
    public String getTransportadora(){return transportadora;} public void setTransportadora(String v){transportadora=v;}
    public String getCodigoRastreio(){return codigoRastreio;} public void setCodigoRastreio(String v){codigoRastreio=v;}
    public Instant getEnviadoEm(){return enviadoEm;} public void setEnviadoEm(Instant v){enviadoEm=v;}
    public Instant getEntregueEm(){return entregueEm;} public void setEntregueEm(Instant v){entregueEm=v;}
    @Version @Column(nullable = false)
    private Long versao;

    @OneToMany(mappedBy = "pedido", cascade = CascadeType.PERSIST)
    @OrderBy("id ASC")
    private List<ItemPedido> itens = new ArrayList<>();
    @OneToMany(mappedBy = "pedido")
    @OrderBy("id ASC")
    private List<Pagamento> pagamentos = new ArrayList<>();
    public List<ItemPedido> getItens() { return itens; }
    public List<Pagamento> getPagamentos() { return pagamentos; }
    public BigDecimal getSubtotal() { return itens.stream().map(ItemPedido::getSubtotal).reduce(BigDecimal.ZERO, BigDecimal::add); }
    public BigDecimal getTotal() { return getSubtotal().add(frete); }

    public Cliente getCliente() { return cliente; }
    public void setCliente(Cliente value) { this.cliente = value; }
    public UUID getChaveCheckout() { return chaveCheckout; }
    public void setChaveCheckout(UUID value) { this.chaveCheckout = value; }
    public String getRequisicaoHash() { return requisicaoHash; }
    public void setRequisicaoHash(String value) { this.requisicaoHash = value; }
    public StatusPedido getStatus() { return status; }
    public void setStatus(StatusPedido value) { this.status = value; }
    public Instant getCriadoEm() { return criadoEm; }
    public void setCriadoEm(Instant value) { this.criadoEm = value; }
    public Instant getExpiraEm() { return expiraEm; }
    public void setExpiraEm(Instant value) { this.expiraEm = value; }
    public BigDecimal getFrete() { return frete; }
    public void setFrete(BigDecimal value) { this.frete = value; }
    public Integer getPrazoDiasUteis() { return prazoDiasUteis; }
    public void setPrazoDiasUteis(Integer value) { this.prazoDiasUteis = value; }
    public EnderecoEntrega getEndereco() { return endereco; }
    public void setEndereco(EnderecoEntrega value) { this.endereco = value; }
    public Long getVersao() { return versao; }
    public void setVersao(Long value) { this.versao = value; }
}
