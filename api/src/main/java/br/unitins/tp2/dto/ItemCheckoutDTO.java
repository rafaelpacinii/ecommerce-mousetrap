package br.unitins.tp2.dto;
import java.math.BigDecimal;
import jakarta.validation.constraints.*;
public record ItemCheckoutDTO(@NotNull @Min(1) Long idMouse, @NotNull @Min(1) @Max(999) Integer quantidade,
        @DecimalMin("0.01") @Digits(integer = 10, fraction = 2) BigDecimal precoEsperado) {}
