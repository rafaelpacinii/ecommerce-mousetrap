package br.unitins.tp2.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "pais")
public class Pais extends DefaultEntity {
    @Column(nullable = false, length = 100, unique = true)
    private String nome;

    @Column(name = "sigla_iso", nullable = false, length = 2, unique = true)
    private String siglaIso;

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getSiglaIso() {
        return siglaIso;
    }

    public void setSiglaIso(String siglaIso) {
        this.siglaIso = siglaIso;
    }
}

