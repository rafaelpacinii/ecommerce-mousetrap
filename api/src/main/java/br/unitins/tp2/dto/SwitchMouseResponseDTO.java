package br.unitins.tp2.dto;

import java.math.BigDecimal;
import br.unitins.tp2.model.SwitchMouse;
import br.unitins.tp2.model.TipoSwitch;

public record SwitchMouseResponseDTO(
        Long id,
        String modelo,
        String fabricante,
        TipoSwitch tipoSwitch,
        Integer durabilidadeMilhoesCliques,
        BigDecimal forcaAtuacaoGf) {
    public static SwitchMouseResponseDTO valueOf(SwitchMouse switchMouse) {
        if (switchMouse == null) {
            return null;
        }
        return new SwitchMouseResponseDTO(
                switchMouse.getId(),
                switchMouse.getModelo(),
                switchMouse.getFabricante(),
                switchMouse.getTipoSwitch(),
                switchMouse.getDurabilidadeMilhoesCliques(),
                switchMouse.getForcaAtuacaoGf());
    }
}
