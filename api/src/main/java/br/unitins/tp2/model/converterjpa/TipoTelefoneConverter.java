package br.unitins.tp2.model.converterjpa;

import br.unitins.tp2.model.TipoTelefone;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class TipoTelefoneConverter implements AttributeConverter<TipoTelefone, Integer> {
    @Override
    public Integer convertToDatabaseColumn(TipoTelefone valor) {
        return valor == null ? null : valor.getId();
    }

    @Override
    public TipoTelefone convertToEntityAttribute(Integer id) {
        return TipoTelefone.valueOf(id);
    }
}

