package br.unitins.tp2.model.converterjpa;
import br.unitins.tp2.model.ResultadoSimulacao;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
@Converter(autoApply = true)
public class ResultadoSimulacaoConverter implements AttributeConverter<ResultadoSimulacao, Integer> {
    public Integer convertToDatabaseColumn(ResultadoSimulacao value) { return value == null ? null : value.getId(); }
    public ResultadoSimulacao convertToEntityAttribute(Integer id) { return ResultadoSimulacao.valueOf(id); }
}
