package br.unitins.tp2.dto;
import jakarta.validation.constraints.*;
public record DecisaoPagamentoDTO(@NotNull @Min(0) Long versao,@NotNull @Min(1) @Max(2) Integer resultado){}
