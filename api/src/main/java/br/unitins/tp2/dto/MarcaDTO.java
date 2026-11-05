package br.unitins.tp2.dto;

import java.util.Locale;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record MarcaDTO(
        @NotBlank(message = "Informe o nome da marca.")
        @Size(min = 2, max = 100, message = "O nome deve ter entre 2 e 100 caracteres.") String nome,
        @NotNull(message = "Informe se a marca está ativa.") Boolean ativo,
        @Size(max = 2048)
        @Pattern(regexp = "^$|^https://[^\\s]+$", message = "Use uma URL HTTPS para a logomarca.")
        String logomarcaUrl,
        @Pattern(regexp = "^$|^[A-Za-z]{2}$", message = "Informe a sigla ISO de 2 letras do país de origem.")
        String siglaPaisOrigem,
        @Size(max = 500, message = "A descrição deve ter no máximo 500 caracteres.")
        String descricao,
        @Size(max = 2048)
        @Pattern(regexp = "^$|^https://[^\\s]+$", message = "Use uma URL HTTPS para o site oficial.")
        String siteOficial,
        @Email(message = "Informe um e-mail de suporte válido.")
        @Size(max = 254, message = "O e-mail de suporte deve ter no máximo 254 caracteres.")
        String emailSuporte,
        @Min(value = 1800, message = "O ano de fundação deve ser a partir de 1800.")
        @Max(value = 2100, message = "O ano de fundação deve ser válido.")
        Integer anoFundacao,
        @Min(value = 1, message = "A garantia padrão deve ser de no mínimo 1 mês.")
        @Max(value = 120, message = "A garantia padrão deve ser de no máximo 120 meses.")
        Integer garantiaPadraoMeses) {
    public MarcaDTO(String nome, Boolean ativo, String logomarcaUrl) {
        this(nome, ativo, logomarcaUrl, null, null, null, null, null, null);
    }

    public MarcaDTO {
        if (nome != null) nome = nome.strip();
        if (logomarcaUrl != null) logomarcaUrl = logomarcaUrl.strip();
        if (siglaPaisOrigem != null) siglaPaisOrigem = siglaPaisOrigem.strip().toUpperCase(Locale.ROOT);
        if (descricao != null) descricao = descricao.strip();
        if (siteOficial != null) siteOficial = siteOficial.strip();
        if (emailSuporte != null) emailSuporte = emailSuporte.strip().toLowerCase(Locale.ROOT);
    }
}
