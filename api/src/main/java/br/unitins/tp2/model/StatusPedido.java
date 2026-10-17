package br.unitins.tp2.model;

import com.fasterxml.jackson.annotation.JsonFormat;

@JsonFormat(shape = JsonFormat.Shape.OBJECT)
public enum StatusPedido {
    AGUARDANDO_PAGAMENTO(1, "Aguardando pagamento"),
    PAGO(2, "Pago"),
    ENVIADO(3, "Enviado"),
    ENTREGUE(4, "Entregue"),
    CANCELADO(5, "Cancelado"),
    EXPIRADO(6, "Expirado");
    private final Integer id;
    private final String label;
    StatusPedido(Integer id, String label) { this.id = id; this.label = label; }
    public Integer getId() { return id; }
    public String getLabel() { return label; }
    public static StatusPedido valueOf(Integer id) {
        if (id == null) return null;
        for (StatusPedido value : values()) if (value.id.equals(id)) return value;
        throw new IllegalArgumentException("Invalid StatusPedido ID: " + id);
    }
}
