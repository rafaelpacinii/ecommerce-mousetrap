package br.unitins.tp2.dto;
import jakarta.validation.constraints.*;
public record OperacaoPedidoDTO(@NotNull @Min(0) Long versao){}
