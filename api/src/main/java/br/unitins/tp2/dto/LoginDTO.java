package br.unitins.tp2.dto;

import java.util.Locale;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginDTO(
        @NotBlank(message = "Informe seu e-mail.")
        @Email(message = "Informe um e-mail válido.")
        @Size(max = 254, message = "O e-mail deve ter no máximo 254 caracteres.") String email,
        @NotBlank(message = "Informe sua senha.")
        @Size(max = 256, message = "A senha excede o tamanho máximo permitido.") String senha) {
    public LoginDTO {
        email = email == null ? null : email.strip().toLowerCase(Locale.ROOT);
    }
}
