package br.unitins.tp2.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record MarcaDTO(
        @NotBlank(message = "Informe o nome da marca.")
        @Size(min = 2, max = 100, message = "O nome deve ter entre 2 e 100 caracteres.") String nome,
        @NotNull(message = "Informe se a marca está ativa.") Boolean ativo,
        @Size(max = 2048)
        @jakarta.validation.constraints.Pattern(regexp = "^$|^https://[^\\s]+$", message = "Use uma URL HTTPS para a logomarca.")
        String logomarcaUrl) {
    public MarcaDTO {
        if (nome != null) nome = nome.strip();
        if (logomarcaUrl != null) logomarcaUrl = logomarcaUrl.strip();
    }
}
