package br.unitins.tp2.model;

import com.fasterxml.jackson.annotation.JsonFormat;

@JsonFormat(shape = JsonFormat.Shape.OBJECT)
public enum StatusPagamento {
    PENDENTE(1, "Pendente"),
    APROVADO(2, "Aprovado"),
    RECUSADO(3, "Recusado"),
    CANCELADO(4, "Cancelado");
    private final Integer id;
    private final String label;
    StatusPagamento(Integer id, String label) { this.id = id; this.label = label; }
    public Integer getId() { return id; }
    public String getLabel() { return label; }
    public static StatusPagamento valueOf(Integer id) {
        if (id == null) return null;
        for (StatusPagamento value : values()) if (value.id.equals(id)) return value;
        throw new IllegalArgumentException("Invalid StatusPagamento ID: " + id);
    }
}
