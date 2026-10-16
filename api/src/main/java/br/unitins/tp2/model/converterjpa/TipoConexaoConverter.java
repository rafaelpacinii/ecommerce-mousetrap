package br.unitins.tp2.model.converterjpa;

import br.unitins.tp2.model.TipoConexao;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class TipoConexaoConverter implements AttributeConverter<TipoConexao, Integer> {
    @Override
    public Integer convertToDatabaseColumn(TipoConexao tipo) {
        return tipo == null ? null : tipo.getId();
    }

    @Override
    public TipoConexao convertToEntityAttribute(Integer id) {
        return TipoConexao.valueOf(id);
    }
}
