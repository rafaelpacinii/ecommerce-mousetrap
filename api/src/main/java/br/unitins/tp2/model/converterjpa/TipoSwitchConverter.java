package br.unitins.tp2.model.converterjpa;

import br.unitins.tp2.model.TipoSwitch;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class TipoSwitchConverter implements AttributeConverter<TipoSwitch, Integer> {
    public Integer convertToDatabaseColumn(TipoSwitch valor) { return valor == null ? null : valor.getId(); }
    public TipoSwitch convertToEntityAttribute(Integer id) { return TipoSwitch.valueOf(id); }
}
