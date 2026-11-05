package br.unitins.tp2.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "marca")
public class Marca extends DefaultEntity {
    @Column(name = "logomarca_url", length = 2048)
    private String logomarcaUrl;

    public String getLogomarcaUrl() { return logomarcaUrl; }
    public void setLogomarcaUrl(String logomarcaUrl) { this.logomarcaUrl = logomarcaUrl; }

    @Column(nullable = false, length = 100, unique = true)
    private String nome;

    @Column(nullable = false)
    private Boolean ativo = true;

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public Boolean getAtivo() { return ativo; }
    public void setAtivo(Boolean ativo) { this.ativo = ativo; }
}
