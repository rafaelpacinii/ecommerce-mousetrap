package br.unitins.tp2.model;

import com.fasterxml.jackson.annotation.JsonFormat;

@JsonFormat(shape = JsonFormat.Shape.OBJECT)
public enum ResultadoSimulacao {
    APROVAR(1, "Aprovar"),
    RECUSAR(2, "Recusar"),
    PENDENTE(3, "Manter pendente");
    private final Integer id;
    private final String label;
    ResultadoSimulacao(Integer id, String label) { this.id = id; this.label = label; }
    public Integer getId() { return id; }
    public String getLabel() { return label; }
    public static ResultadoSimulacao valueOf(Integer id) {
        if (id == null) return null;
        for (ResultadoSimulacao value : values()) if (value.id.equals(id)) return value;
        throw new IllegalArgumentException("Invalid ResultadoSimulacao ID: " + id);
    }
}
