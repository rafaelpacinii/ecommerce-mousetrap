package br.unitins.tp2.dto;

import jakarta.validation.constraints.*;

public record ImagemMouseDTO(
        @NotBlank @Size(max = 2048)
        @Pattern(regexp = "^(https?://[^\\s]+|/(?!/)[^\\s]*)$", message = "Use uma URL HTTP(S) ou um caminho local iniciado por /.") String url,
        @NotBlank @Size(max = 200) String textoAlternativo,
        @NotNull @Min(0) Integer ordem) {
    public ImagemMouseDTO {
        if (url != null) url = url.strip();
        if (textoAlternativo != null) textoAlternativo = textoAlternativo.strip();
    }
}
