package br.unitins.tp2.model.converterjpa;
import br.unitins.tp2.model.FormaPagamento;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
@Converter(autoApply = true)
public class FormaPagamentoConverter implements AttributeConverter<FormaPagamento, Integer> {
    public Integer convertToDatabaseColumn(FormaPagamento value) { return value == null ? null : value.getId(); }
    public FormaPagamento convertToEntityAttribute(Integer id) { return FormaPagamento.valueOf(id); }
}
