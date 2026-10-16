package br.unitins.tp2.dto;

import java.math.BigDecimal;
import java.util.Locale;
import java.util.Set;
import jakarta.validation.constraints.*;

public record MouseDTO(
        @NotBlank(message = "Informe o SKU.") @Size(max = 50)
        @Pattern(regexp = "[A-Z0-9][A-Z0-9._-]*", message = "Use letras, números, ponto, hífen ou sublinhado no SKU.") String sku,
        @NotBlank(message = "Informe o nome.") @Size(min = 2, max = 150) String nome,
        @NotBlank(message = "Informe a descrição.") @Size(max = 5000) String descricao,
        @NotBlank(message = "Informe a cor.") @Size(max = 50) String cor,
        @NotNull @DecimalMin(value = "0.01", message = "O preço deve ser positivo.")
        @Digits(integer = 10, fraction = 2) BigDecimal preco,
        @NotNull @Min(value = 0, message = "O estoque não pode ser negativo.") Integer quantidadeEstoque,
        @NotNull @Min(value = 1, message = "O DPI deve ser positivo.") Integer dpiMaximo,
        @NotNull @Min(value = 1, message = "Informe ao menos um botão.") Integer quantidadeBotoes,
        @NotNull @DecimalMin("0.01") @Digits(integer = 6, fraction = 2) BigDecimal pesoGramas,
        @NotNull Boolean ativo,
        @NotNull(message = "Selecione uma marca.") @Positive Long idMarca,
        @NotEmpty(message = "Selecione ao menos uma conexão.") @Size(max = 3)
        Set<@NotNull @Min(1) @Max(3) Integer> tiposConexao,
        @PositiveOrZero Long versao) {
    public MouseDTO {
        if (sku != null) sku = sku.strip().toUpperCase(Locale.ROOT);
        if (nome != null) nome = nome.strip();
        if (descricao != null) descricao = descricao.strip();
        if (cor != null) cor = cor.strip();
    }
}
