package br.unitins.tp2.dto;
import java.util.UUID;
import jakarta.validation.constraints.*;
public record PagamentoDTO(@NotNull UUID chaveIdempotencia, @NotNull @Min(1) @Max(2) Integer forma,
        @NotNull @Min(1) @Max(3) Integer resultadoSimulado) {}
