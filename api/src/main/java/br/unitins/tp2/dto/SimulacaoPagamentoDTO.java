package br.unitins.tp2.dto;
import jakarta.validation.constraints.*;
public record SimulacaoPagamentoDTO(@NotNull @Min(1) @Max(2) Integer resultado) {}
