package br.unitins.tp2.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record TelefoneClienteDTO(
        @NotBlank(message = "Informe o DDD.")
        @Pattern(regexp = "[0-9]{2}", message = "Informe um DDD com dois dígitos.") String ddd,
        @NotBlank(message = "Informe o número do telefone.")
        @Pattern(regexp = "[0-9]{8,9}", message = "Informe um telefone com 8 ou 9 dígitos.") String numero,
        @NotNull(message = "Informe o tipo de telefone.")
        @Min(1) @Max(3) Integer tipoTelefone,
        Boolean principal) {
    public TelefoneClienteDTO {
        if (ddd != null) ddd = ddd.strip();
        if (numero != null) numero = numero.strip().replaceAll("[^0-9]", "");
    }
}

