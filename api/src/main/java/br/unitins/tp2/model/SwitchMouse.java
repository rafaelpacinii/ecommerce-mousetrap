package br.unitins.tp2.model;

import java.math.BigDecimal;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

@Entity
@Table(name = "switch_mouse")
public class SwitchMouse extends DefaultEntity {
    @Column(nullable = false, length = 100, unique = true)
    private String modelo;

    @Column(nullable = false, length = 100)
    private String fabricante = "Omron";

    @Column(name = "tipo_switch", nullable = false)
    private TipoSwitch tipoSwitch;

    @Column(name = "durabilidade_milhoes_cliques", nullable = false)
    private Integer durabilidadeMilhoesCliques = 50;

    @Column(name = "forca_atuacao_gf", precision = 5, scale = 1)
    private BigDecimal forcaAtuacaoGf;

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

    public TipoSwitch getTipoSwitch() {
        return tipoSwitch;
    }

    public void setTipoSwitch(TipoSwitch tipoSwitch) {
        this.tipoSwitch = tipoSwitch;
    }

    public Integer getDurabilidadeMilhoesCliques() {
        return durabilidadeMilhoesCliques;
    }

    public void setDurabilidadeMilhoesCliques(Integer durabilidadeMilhoesCliques) {
        this.durabilidadeMilhoesCliques = durabilidadeMilhoesCliques;
    }

    public BigDecimal getForcaAtuacaoGf() {
        return forcaAtuacaoGf;
    }

    public void setForcaAtuacaoGf(BigDecimal forcaAtuacaoGf) {
        this.forcaAtuacaoGf = forcaAtuacaoGf;
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

