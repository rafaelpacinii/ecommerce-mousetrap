package br.unitins.tp2.model;

import com.fasterxml.jackson.annotation.JsonFormat;

@JsonFormat(shape = JsonFormat.Shape.OBJECT)
public enum Pegada {
    PALM(1, "Palm"),
    CLAW(2, "Claw"),
    FINGERTIP(3, "Fingertip");
    private final Integer id;
    private final String label;
    Pegada(Integer id, String label) { this.id = id; this.label = label; }
    public Integer getId() { return id; }
    public String getLabel() { return label; }
    public static Pegada valueOf(Integer id) {
        if (id == null) return null;
        for (Pegada valor : values()) if (valor.id.equals(id)) return valor;
        throw new IllegalArgumentException("Invalid Pegada ID: " + id);
    }
}
