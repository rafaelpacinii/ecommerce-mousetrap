package br.unitins.tp2.model;

import jakarta.persistence.*;

@Entity
public class Cliente extends DefaultEntity {
    @Column(nullable = false, length = 100)
    private String nome;
    @Column(nullable = false, unique = true, length = 254)
    private String email;
    @Column(nullable = false, length = 8)
    private String cep;
    @Column(nullable = false, length = 200)
    private String logradouro;
    @Column(nullable = false, length = 100)
    private String bairro;
    @Column(nullable = false, length = 20)
    private String numero;
    @Column(length = 100)
    private String complemento;
    @ManyToOne(optional = false) @JoinColumn(name = "municipio_id", nullable = false)
    private Municipio municipio;
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getCep() { return cep; }
    public void setCep(String cep) { this.cep = cep; }
    public String getLogradouro() { return logradouro; }
    public void setLogradouro(String logradouro) { this.logradouro = logradouro; }
    public String getBairro() { return bairro; }
    public void setBairro(String bairro) { this.bairro = bairro; }
    public String getNumero() { return numero; }
    public void setNumero(String numero) { this.numero = numero; }
    public String getComplemento() { return complemento; }
    public void setComplemento(String complemento) { this.complemento = complemento; }
    public Municipio getMunicipio() { return municipio; }
    public void setMunicipio(Municipio municipio) { this.municipio = municipio; }
}
