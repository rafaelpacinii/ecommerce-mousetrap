package br.unitins.tp2.dto;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import br.unitins.tp2.model.Mouse;
import br.unitins.tp2.model.Pegada;
import br.unitins.tp2.model.TipoSwitch;

public record EspecificacoesMouseResponseDTO(
        String sensor,
        Integer pollingRate,
        TipoSwitch tipoSwitch,
        String modeloSwitch,
        List<Pegada> pegadas,
        BigDecimal comprimentoMm,
        BigDecimal larguraMm,
        BigDecimal alturaMm,
        Integer autonomiaBateriaHoras,
        Integer garantiaMeses,
        SensorResponseDTO sensorDetalhes,
        SwitchMouseResponseDTO switchDetalhes) {
    public static EspecificacoesMouseResponseDTO valueOf(Mouse mouse) {
        return new EspecificacoesMouseResponseDTO(
                mouse.getSensor(),
                mouse.getPollingRate(),
                mouse.getTipoSwitch(),
                mouse.getModeloSwitch(),
                mouse.getPegadas().stream().sorted(Comparator.comparing(p -> p.getId())).toList(),
                mouse.getComprimentoMm(),
                mouse.getLarguraMm(),
                mouse.getAlturaMm(),
                mouse.getAutonomiaBateriaHoras(),
                mouse.getGarantiaMeses(),
                SensorResponseDTO.valueOf(mouse.getSensorEntidade()),
                SwitchMouseResponseDTO.valueOf(mouse.getSwitchEntidade()));
    }
}
