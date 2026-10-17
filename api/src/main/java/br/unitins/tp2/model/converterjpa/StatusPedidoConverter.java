package br.unitins.tp2.model.converterjpa;
import br.unitins.tp2.model.StatusPedido;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
@Converter(autoApply = true)
public class StatusPedidoConverter implements AttributeConverter<StatusPedido, Integer> {
    public Integer convertToDatabaseColumn(StatusPedido value) { return value == null ? null : value.getId(); }
    public StatusPedido convertToEntityAttribute(Integer id) { return StatusPedido.valueOf(id); }
}
