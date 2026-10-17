package br.unitins.tp2.model;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import jakarta.persistence.*;
@Entity
@Table(name = "item_pedido")
public class ItemPedido extends DefaultEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "pedido_id", nullable = false)
    private Pedido pedido;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "mouse_id", nullable = false)
    private Mouse mouse;
    @Column(nullable = false, length = 50)
    private String sku;
    @Column(nullable = false, length = 150)
    private String nome;
    @Column(nullable = false, length = 50)
    private String cor;
    @Column(nullable = false, length = 100)
    private String marca;
    @Column(nullable = false)
    private Integer quantidade;
    @Column(name = "preco_unitario", nullable = false, precision = 12, scale = 2)
    private BigDecimal precoUnitario;
    public BigDecimal getSubtotal() { return precoUnitario.multiply(BigDecimal.valueOf(quantidade)); }
    public Pedido getPedido() { return pedido; }
    public void setPedido(Pedido value) { this.pedido = value; }
    public Mouse getMouse() { return mouse; }
    public void setMouse(Mouse value) { this.mouse = value; }
    public String getSku() { return sku; }
    public void setSku(String value) { this.sku = value; }
    public String getNome() { return nome; }
    public void setNome(String value) { this.nome = value; }
    public String getCor() { return cor; }
    public void setCor(String value) { this.cor = value; }
    public String getMarca() { return marca; }
    public void setMarca(String value) { this.marca = value; }
    public Integer getQuantidade() { return quantidade; }
    public void setQuantidade(Integer value) { this.quantidade = value; }
    public BigDecimal getPrecoUnitario() { return precoUnitario; }
    public void setPrecoUnitario(BigDecimal value) { this.precoUnitario = value; }
}
