package br.unitins.tp2.model;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;
import jakarta.persistence.*;

@Entity
@Table(name = "mouse")
public class Mouse extends DefaultEntity {
    @Column(nullable = false, length = 50, unique = true)
    private String sku;

    @Column(nullable = false, length = 150)
    private String nome;

    @Column(nullable = false, columnDefinition = "text")
    private String descricao;

    @Column(nullable = false, length = 50)
    private String cor;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal preco;

    @Column(name = "quantidade_estoque", nullable = false)
    private Integer quantidadeEstoque;

    @Column(name = "dpi_maximo", nullable = false)
    private Integer dpiMaximo;

    @Column(name = "quantidade_botoes", nullable = false)
    private Integer quantidadeBotoes;

    @Column(name = "peso_gramas", nullable = false, precision = 8, scale = 2)
    private BigDecimal pesoGramas;

    @Column(nullable = false)
    private Boolean ativo;

    @Version
    @Column(nullable = false)
    private Long versao;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "marca_id", nullable = false)
    private Marca marca;

    @ElementCollection
    @CollectionTable(name = "mouse_conexao", joinColumns = @JoinColumn(name = "mouse_id"),
            uniqueConstraints = @UniqueConstraint(columnNames = {"mouse_id", "tipo_conexao"}))
    @Column(name = "tipo_conexao", nullable = false)
    private Set<TipoConexao> tiposConexao = new HashSet<>();

    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }

    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }

    public String getCor() { return cor; }
    public void setCor(String cor) { this.cor = cor; }

    public BigDecimal getPreco() { return preco; }
    public void setPreco(BigDecimal preco) { this.preco = preco; }

    public Integer getQuantidadeEstoque() { return quantidadeEstoque; }
    public void setQuantidadeEstoque(Integer quantidadeEstoque) { this.quantidadeEstoque = quantidadeEstoque; }

    public Integer getDpiMaximo() { return dpiMaximo; }
    public void setDpiMaximo(Integer dpiMaximo) { this.dpiMaximo = dpiMaximo; }

    public Integer getQuantidadeBotoes() { return quantidadeBotoes; }
    public void setQuantidadeBotoes(Integer quantidadeBotoes) { this.quantidadeBotoes = quantidadeBotoes; }

    public BigDecimal getPesoGramas() { return pesoGramas; }
    public void setPesoGramas(BigDecimal pesoGramas) { this.pesoGramas = pesoGramas; }

    public Boolean getAtivo() { return ativo; }
    public void setAtivo(Boolean ativo) { this.ativo = ativo; }

    public Long getVersao() { return versao; }
    public void setVersao(Long versao) { this.versao = versao; }

    public Marca getMarca() { return marca; }
    public void setMarca(Marca marca) { this.marca = marca; }

    public Set<TipoConexao> getTiposConexao() { return tiposConexao; }
    public void setTiposConexao(Set<TipoConexao> tiposConexao) { this.tiposConexao = tiposConexao; }
}
