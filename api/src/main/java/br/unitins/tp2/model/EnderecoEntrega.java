package br.unitins.tp2.model;
import jakarta.persistence.*;
@Embeddable
public class EnderecoEntrega {
    @Column(name = "entrega_destinatario", length = 150, nullable = false)
    private String destinatario;
    @Column(name = "entrega_cep", length = 8, nullable = false)
    private String cep;
    @Column(name = "entrega_logradouro", length = 200, nullable = false)
    private String logradouro;
    @Column(name = "entrega_bairro", length = 100, nullable = false)
    private String bairro;
    @Column(name = "entrega_numero", length = 20, nullable = false)
    private String numero;
    @Column(name = "entrega_complemento", length = 100, nullable = true)
    private String complemento;
    @Column(name = "entrega_municipio", length = 150, nullable = false)
    private String municipio;
    @Column(name = "entrega_uf", length = 2, nullable = false)
    private String uf;
    public static EnderecoEntrega valueOf(Endereco e) {
        EnderecoEntrega v = new EnderecoEntrega();
        v.destinatario = e.getDestinatario(); v.cep = e.getCep(); v.logradouro = e.getLogradouro();
        v.bairro = e.getBairro(); v.numero = e.getNumero(); v.complemento = e.getComplemento();
        v.municipio = e.getMunicipio().getNome(); v.uf = e.getMunicipio().getEstado().getSigla();
        return v;
    }
    public String getDestinatario() { return destinatario; }
    public String getCep() { return cep; }
    public String getLogradouro() { return logradouro; }
    public String getBairro() { return bairro; }
    public String getNumero() { return numero; }
    public String getComplemento() { return complemento; }
    public String getMunicipio() { return municipio; }
    public String getUf() { return uf; }
}
