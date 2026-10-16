package br.unitins.tp2.dto;

import java.util.Locale;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ClienteDTO(
        @NotBlank(message = "Informe o nome do cliente.")
        @Size(min = 2, max = 100, message = "O nome deve ter entre 2 e 100 caracteres.") String nome,
        @NotBlank(message = "Informe o e-mail.")
        @Email(message = "Informe um e-mail válido.")
        @Size(max = 254, message = "O e-mail deve ter no máximo 254 caracteres.") String email,
        @NotBlank(message = "Informe o CEP.")
        @Pattern(regexp = "[0-9]{8}", message = "Informe um CEP com oito dígitos.") String cep,
        @NotBlank(message = "Informe o logradouro.")
        @Size(max = 200, message = "O logradouro deve ter no máximo 200 caracteres.") String logradouro,
        @NotBlank(message = "Informe o bairro.")
        @Size(max = 100, message = "O bairro deve ter no máximo 100 caracteres.") String bairro,
        @NotBlank(message = "Informe o número ou S/N.")
        @Size(max = 20, message = "O número deve ter no máximo 20 caracteres.") String numero,
        @Size(max = 100, message = "O complemento deve ter no máximo 100 caracteres.") String complemento) {
    public ClienteDTO {
        nome = limpar(nome);
        email = email == null ? null : email.strip().toLowerCase(Locale.ROOT);
        logradouro = limpar(logradouro);
        bairro = limpar(bairro);
        numero = limpar(numero);
        complemento = limpar(complemento);
    }

    private static String limpar(String valor) {
        return valor == null ? null : valor.strip();
    }
}
