package br.unitins.tp2.dto;
import jakarta.validation.constraints.*;
public record EnvioPedidoDTO(@NotNull @Min(0) Long versao,@NotBlank @Size(max=100) String transportadora,
    @NotBlank @Size(max=80) @Pattern(regexp="[A-Za-z0-9][A-Za-z0-9 ._/-]*") String codigoRastreio){}
