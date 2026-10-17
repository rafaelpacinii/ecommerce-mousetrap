package br.unitins.tp2.model;
import jakarta.persistence.*;
@Entity @Table(name="desejo",uniqueConstraints=@UniqueConstraint(columnNames={"identidade_subject","mouse_id"}))
public class Desejo extends DefaultEntity {
    @Column(name="identidade_subject",nullable=false,length=255) private String identidadeSubject;
    @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="mouse_id",nullable=false) private Mouse mouse;
    public String getIdentidadeSubject(){return identidadeSubject;} public void setIdentidadeSubject(String v){identidadeSubject=v;}
    public Mouse getMouse(){return mouse;} public void setMouse(Mouse v){mouse=v;}
}
