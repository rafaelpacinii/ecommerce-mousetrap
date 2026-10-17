package br.unitins.tp2.dto;

import java.util.Comparator;
import java.util.List;
import br.unitins.tp2.model.*;

public record EspecificacoesMouseResponseDTO(String sensor, Integer pollingRate, TipoSwitch tipoSwitch,
        String modeloSwitch, List<Pegada> pegadas) {
    public static EspecificacoesMouseResponseDTO valueOf(Mouse mouse) {
        return new EspecificacoesMouseResponseDTO(mouse.getSensor(), mouse.getPollingRate(), mouse.getTipoSwitch(),
                mouse.getModeloSwitch(), mouse.getPegadas().stream().sorted(Comparator.comparing(p -> p.getId())).toList());
    }
}
