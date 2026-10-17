package br.unitins.tp2.dto;

import java.util.Set;
import jakarta.validation.constraints.*;

public record EspecificacoesMouseDTO(
        @Size(max = 100) String sensor,
        @Min(125) @Max(8000) Integer pollingRate,
        @Min(1) @Max(2) Integer tipoSwitch,
        @Size(max = 100) String modeloSwitch,
        @Size(max = 3) Set<@NotNull @Min(1) @Max(3) Integer> pegadas) {
    public EspecificacoesMouseDTO {
        if (sensor != null) sensor = sensor.strip();
        if (modeloSwitch != null) modeloSwitch = modeloSwitch.strip();
    }
}
