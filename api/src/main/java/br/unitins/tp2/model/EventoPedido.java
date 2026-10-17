package br.unitins.tp2.model;
import java.time.Instant;
import jakarta.persistence.*;
@Entity @Table(name="evento_pedido")
public class EventoPedido extends DefaultEntity {
    @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="pedido_id",nullable=false)
    private Pedido pedido;
    @Column(nullable=false) private StatusPedido status;
    @Column(name="ocorrido_em",nullable=false) private Instant ocorridoEm;
    @Column(nullable=false,length=200) private String descricao;
    @Column(name="responsavel_subject",length=255) private String responsavelSubject;
    public Pedido getPedido(){return pedido;} public void setPedido(Pedido v){pedido=v;}
    public StatusPedido getStatus(){return status;} public void setStatus(StatusPedido v){status=v;}
    public Instant getOcorridoEm(){return ocorridoEm;} public void setOcorridoEm(Instant v){ocorridoEm=v;}
    public String getDescricao(){return descricao;} public void setDescricao(String v){descricao=v;}
    public String getResponsavelSubject(){return responsavelSubject;} public void setResponsavelSubject(String v){responsavelSubject=v;}
}
