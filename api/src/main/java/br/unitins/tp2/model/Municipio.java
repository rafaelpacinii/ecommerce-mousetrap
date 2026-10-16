package br.unitins.tp2.model;

import jakarta.persistence.*;

@Entity
public class Municipio extends DefaultEntity {
    @Column(nullable = false, length = 150)
    private String nome;
    @Column(name = "codigo_ibge", nullable = false, unique = true, length = 7)
    private String codigoIbge;
    @ManyToOne(optional = false) @JoinColumn(name = "estado_id", nullable = false)
    private Estado estado;
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getCodigoIbge() { return codigoIbge; }
    public void setCodigoIbge(String codigoIbge) { this.codigoIbge = codigoIbge; }
    public Estado getEstado() { return estado; }
    public void setEstado(Estado estado) { this.estado = estado; }
}
