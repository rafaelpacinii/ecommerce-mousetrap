package br.unitins.tp2.dto;

import java.math.BigDecimal;
import java.util.Set;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record EspecificacoesMouseDTO(
        @Size(max = 100) String sensor,
        @Min(125) @Max(8000) Integer pollingRate,
        @Min(1) @Max(2) Integer tipoSwitch,
        @Size(max = 100) String modeloSwitch,
        @Size(max = 3) Set<@NotNull @Min(1) @Max(3) Integer> pegadas,
        @DecimalMin("30.0") @DecimalMax("250.0") @Digits(integer = 3, fraction = 2) BigDecimal comprimentoMm,
        @DecimalMin("20.0") @DecimalMax("200.0") @Digits(integer = 3, fraction = 2) BigDecimal larguraMm,
        @DecimalMin("10.0") @DecimalMax("150.0") @Digits(integer = 3, fraction = 2) BigDecimal alturaMm,
        @Min(1) @Max(5000) Integer autonomiaBateriaHoras,
        @Min(1) @Max(120) Integer garantiaMeses,
        @Size(max = 100) String sensorFabricante,
        @Min(50) @Max(2000) Integer sensorIps,
        @Min(10) @Max(200) Integer sensorAceleracaoG,
        @Size(max = 100) String switchFabricante,
        @Min(1) @Max(500) Integer switchDurabilidadeMilhoesCliques,
        @DecimalMin("10.0") @DecimalMax("200.0") @Digits(integer = 4, fraction = 1) BigDecimal switchForcaAtuacaoGf) {
    public EspecificacoesMouseDTO(
            String sensor,
            Integer pollingRate,
            Integer tipoSwitch,
            String modeloSwitch,
            Set<Integer> pegadas) {
        this(sensor, pollingRate, tipoSwitch, modeloSwitch, pegadas,
                null, null, null, null, null, null, null, null, null, null, null);
    }

    public EspecificacoesMouseDTO {
        if (sensor != null) sensor = sensor.strip();
        if (modeloSwitch != null) modeloSwitch = modeloSwitch.strip();
        if (sensorFabricante != null) sensorFabricante = sensorFabricante.strip();
        if (switchFabricante != null) switchFabricante = switchFabricante.strip();
    }
}
