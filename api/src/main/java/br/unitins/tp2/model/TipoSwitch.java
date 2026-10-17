package br.unitins.tp2.model;

import com.fasterxml.jackson.annotation.JsonFormat;

@JsonFormat(shape = JsonFormat.Shape.OBJECT)
public enum TipoSwitch {
    OPTICO(1, "Óptico"),
    MECANICO(2, "Mecânico");
    private final Integer id;
    private final String label;
    TipoSwitch(Integer id, String label) { this.id = id; this.label = label; }
    public Integer getId() { return id; }
    public String getLabel() { return label; }
    public static TipoSwitch valueOf(Integer id) {
        if (id == null) return null;
        for (TipoSwitch valor : values()) if (valor.id.equals(id)) return valor;
        throw new IllegalArgumentException("Invalid TipoSwitch ID: " + id);
    }
}
