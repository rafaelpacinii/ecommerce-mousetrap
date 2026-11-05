package br.unitins.tp2.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

@Entity
@Table(name = "sensor")
public class Sensor extends DefaultEntity {
    @Column(nullable = false, length = 100, unique = true)
    private String modelo;

    @Column(nullable = false, length = 100)
    private String fabricante = "PixArt";

    @Column(name = "dpi_maximo", nullable = false)
    private Integer dpiMaximo;

    @Column(nullable = false)
    private Integer ips = 400;

    @Column(name = "aceleracao_g", nullable = false)
    private Integer aceleracaoG = 40;

    @Column(nullable = false)
    private Boolean ativo = true;

    @Version
    @Column(nullable = false)
    private Long versao = 0L;

    public String getModelo() {
        return modelo;
    }

    public void setModelo(String modelo) {
        this.modelo = modelo;
    }

    public String getFabricante() {
        return fabricante;
    }

    public void setFabricante(String fabricante) {
        this.fabricante = fabricante;
    }

    public Integer getDpiMaximo() {
        return dpiMaximo;
    }

    public void setDpiMaximo(Integer dpiMaximo) {
        this.dpiMaximo = dpiMaximo;
    }

    public Integer getIps() {
        return ips;
    }

    public void setIps(Integer ips) {
        this.ips = ips;
    }

    public Integer getAceleracaoG() {
        return aceleracaoG;
    }

    public void setAceleracaoG(Integer aceleracaoG) {
        this.aceleracaoG = aceleracaoG;
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

