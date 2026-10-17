package br.unitins.tp2.model.converterjpa;
import br.unitins.tp2.model.StatusPagamento;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
@Converter(autoApply = true)
public class StatusPagamentoConverter implements AttributeConverter<StatusPagamento, Integer> {
    public Integer convertToDatabaseColumn(StatusPagamento value) { return value == null ? null : value.getId(); }
    public StatusPagamento convertToEntityAttribute(Integer id) { return StatusPagamento.valueOf(id); }
}
