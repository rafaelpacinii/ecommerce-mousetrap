package br.unitins.tp2.dto;

import java.util.Locale;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record VinculoClienteDTO(
        @NotBlank @Size(max = 255) String identidadeSubject,
        @NotBlank @Email @Size(max = 254) String email) {
    public VinculoClienteDTO {
        identidadeSubject = identidadeSubject == null ? null : identidadeSubject.strip();
        email = email == null ? null : email.strip().toLowerCase(Locale.ROOT);
    }
}
