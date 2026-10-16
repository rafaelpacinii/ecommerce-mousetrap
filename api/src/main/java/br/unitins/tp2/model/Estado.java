package br.unitins.tp2.model;

import jakarta.persistence.*;

@Entity
public class Estado extends DefaultEntity {
    @Column(nullable = false, length = 100)
    private String nome;
    @Column(nullable = false, unique = true, length = 2)
    private String sigla;
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getSigla() { return sigla; }
    public void setSigla(String sigla) { this.sigla = sigla; }
}
