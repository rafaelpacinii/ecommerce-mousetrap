package br.unitins.tp2.model.converterjpa;

import br.unitins.tp2.model.Pegada;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class PegadaConverter implements AttributeConverter<Pegada, Integer> {
    public Integer convertToDatabaseColumn(Pegada valor) { return valor == null ? null : valor.getId(); }
    public Pegada convertToEntityAttribute(Integer id) { return Pegada.valueOf(id); }
}
