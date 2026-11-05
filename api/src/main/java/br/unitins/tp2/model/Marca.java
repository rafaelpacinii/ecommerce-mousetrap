package br.unitins.tp2.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

@Entity
@Table(name = "marca")
public class Marca extends DefaultEntity {
    @Column(name = "logomarca_url", length = 2048)
    private String logomarcaUrl;

    @Column(nullable = false, length = 100, unique = true)
    private String nome;

    @Column(nullable = false)
    private Boolean ativo = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pais_origem_id")
    private Pais paisOrigem;

    @Column(length = 1000)
    private String descricao;

    @Column(name = "site_oficial", length = 500)
    private String siteOficial;

    @Column(name = "email_suporte", length = 254)
    private String emailSuporte;

    @Column(name = "ano_fundacao")
    private Integer anoFundacao;

    @Column(name = "garantia_padrao_meses", nullable = false)
    private Integer garantiaPadraoMeses = 12;

    @Version
    @Column(nullable = false)
    private Long versao = 0L;

    public String getLogomarcaUrl() {
        return logomarcaUrl;
    }

    public void setLogomarcaUrl(String logomarcaUrl) {
        this.logomarcaUrl = logomarcaUrl;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public Boolean getAtivo() {
        return ativo;
    }

    public void setAtivo(Boolean ativo) {
        this.ativo = ativo;
    }

    public Pais getPaisOrigem() {
        return paisOrigem;
    }

    public void setPaisOrigem(Pais paisOrigem) {
        this.paisOrigem = paisOrigem;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public String getSiteOficial() {
        return siteOficial;
    }

    public void setSiteOficial(String siteOficial) {
        this.siteOficial = siteOficial;
    }

    public String getEmailSuporte() {
        return emailSuporte;
    }

    public void setEmailSuporte(String emailSuporte) {
        this.emailSuporte = emailSuporte;
    }

    public Integer getAnoFundacao() {
        return anoFundacao;
    }

    public void setAnoFundacao(Integer anoFundacao) {
        this.anoFundacao = anoFundacao;
    }

    public Integer getGarantiaPadraoMeses() {
        return garantiaPadraoMeses;
    }

    public void setGarantiaPadraoMeses(Integer garantiaPadraoMeses) {
        this.garantiaPadraoMeses = garantiaPadraoMeses;
    }

    public Long getVersao() {
        return versao;
    }

    public void setVersao(Long versao) {
        this.versao = versao;
    }
}
