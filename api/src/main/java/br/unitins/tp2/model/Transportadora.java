package br.unitins.tp2.model;

import java.math.BigDecimal;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

@Entity
@Table(name = "transportadora")
public class Transportadora extends DefaultEntity {
    @Column(nullable = false, length = 100, unique = true)
    private String nome;

    @Column(length = 14, unique = true)
    private String cnpj;

    @Column(name = "url_rastreio_padrao", length = 500)
    private String urlRastreioPadrao;

    @Column(name = "valor_base_frete", nullable = false, precision = 12, scale = 2)
    private BigDecimal valorBaseFrete = BigDecimal.ZERO;

    @Column(name = "prazo_medio_dias", nullable = false)
    private Integer prazoMedioDias = 5;

    @Column(nullable = false)
    private Boolean ativo = true;

    @Version
    @Column(nullable = false)
    private Long versao = 0L;

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getCnpj() {
        return cnpj;
    }

    public void setCnpj(String cnpj) {
        this.cnpj = cnpj;
    }

    public String getUrlRastreioPadrao() {
        return urlRastreioPadrao;
    }

    public void setUrlRastreioPadrao(String urlRastreioPadrao) {
        this.urlRastreioPadrao = urlRastreioPadrao;
    }

    public BigDecimal getValorBaseFrete() {
        return valorBaseFrete;
    }

    public void setValorBaseFrete(BigDecimal valorBaseFrete) {
        this.valorBaseFrete = valorBaseFrete;
    }

    public Integer getPrazoMedioDias() {
        return prazoMedioDias;
    }

    public void setPrazoMedioDias(Integer prazoMedioDias) {
        this.prazoMedioDias = prazoMedioDias;
    }

    public Boolean getAtivo() {
        return ativo;
    }

    public void setAtivo(Boolean ativo) {
        this.ativo = ativo;
    }

    public Long getVersao() {
        return versao;
    }

    public void setVersao(Long versao) {
        this.versao = versao;
    }
}

