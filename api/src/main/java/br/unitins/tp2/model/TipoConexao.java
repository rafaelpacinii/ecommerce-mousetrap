package br.unitins.tp2.model;

import com.fasterxml.jackson.annotation.JsonFormat;

@JsonFormat(shape = JsonFormat.Shape.OBJECT)
public enum TipoConexao {
    USB(1, "USB"),
    BLUETOOTH(2, "Bluetooth"),
    RECEPTOR_USB(3, "Receptor USB sem fio");

    private final Integer id;
    private final String label;

    private TipoConexao(Integer id, String label) {
        this.id = id;
        this.label = label;
    }

    public Integer getId() { return id; }
    public String getLabel() { return label; }

    public static TipoConexao valueOf(Integer id) {
        if (id == null) return null;
        for (TipoConexao tipo : values()) {
            if (tipo.id.equals(id)) return tipo;
        }
        throw new IllegalArgumentException("Tipo de conexão inválido: " + id);
    }
}
