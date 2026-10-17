package br.unitins.tp2.model;

import com.fasterxml.jackson.annotation.JsonFormat;

@JsonFormat(shape = JsonFormat.Shape.OBJECT)
public enum FormaPagamento {
    PIX(1, "PIX"),
    CARTAO(2, "Cartão de crédito");
    private final Integer id;
    private final String label;
    FormaPagamento(Integer id, String label) { this.id = id; this.label = label; }
    public Integer getId() { return id; }
    public String getLabel() { return label; }
    public static FormaPagamento valueOf(Integer id) {
        if (id == null) return null;
        for (FormaPagamento value : values()) if (value.id.equals(id)) return value;
        throw new IllegalArgumentException("Invalid FormaPagamento ID: " + id);
    }
}
