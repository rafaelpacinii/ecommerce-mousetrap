package br.unitins.tp2.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
    name = "desejo",
    uniqueConstraints = @UniqueConstraint(columnNames = {"identidade_subject", "mouse_id"})
)
public class Desejo extends DefaultEntity {
    @Column(name = "identidade_subject", nullable = false, length = 255)
    private String identidadeSubject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id")
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "mouse_id", nullable = false)
    private Mouse mouse;

    public String getIdentidadeSubject() {
        return identidadeSubject;
    }

    public void setIdentidadeSubject(String v) {
        identidadeSubject = v;
    }

    public Cliente getCliente() {
        return cliente;
    }

    public void setCliente(Cliente cliente) {
        this.cliente = cliente;
    }

    public Mouse getMouse() {
        return mouse;
    }

    public void setMouse(Mouse v) {
        mouse = v;
    }
}
