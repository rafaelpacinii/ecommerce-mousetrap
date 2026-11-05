package br.unitins.tp2.model;

import com.fasterxml.jackson.annotation.JsonFormat;

@JsonFormat(shape = JsonFormat.Shape.OBJECT)
public enum TipoTelefone {
    CELULAR(1, "Celular"),
    RESIDENCIAL(2, "Residencial"),
    COMERCIAL(3, "Comercial");

    private final Integer id;
    private final String label;

    TipoTelefone(Integer id, String label) {
        this.id = id;
        this.label = label;
    }

    public Integer getId() {
        return id;
    }

    public String getLabel() {
        return label;
    }

    public static TipoTelefone valueOf(Integer id) {
        if (id == null)
            return null;
        for (TipoTelefone valor : values()) {
            if (valor.id.equals(id))
                return valor;
        }
        throw new IllegalArgumentException("Invalid TipoTelefone ID: " + id);
    }
}

