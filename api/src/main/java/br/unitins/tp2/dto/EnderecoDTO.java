package br.unitins.tp2.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record EnderecoDTO(
        @NotBlank @Size(min = 1, max = 60) String apelido,
        @Size(min = 2, max = 150) String destinatario,
        @NotBlank @Pattern(regexp = "[0-9]{5}-?[0-9]{3}") String cep,
        @NotBlank @Size(max = 200) String logradouro,
        @NotBlank @Size(max = 100) String bairro,
        @NotBlank @Size(max = 20) String numero,
        @Size(max = 100) String complemento,
        Boolean principal) {
    public EnderecoDTO {
        apelido = apelido == null ? null : apelido.strip();
        destinatario = destinatario == null || destinatario.isBlank() ? null : destinatario.strip();
        cep = cep == null ? null : cep.replace("-", "");
        logradouro = logradouro == null ? null : logradouro.strip();
        bairro = bairro == null ? null : bairro.strip();
        numero = numero == null ? null : numero.strip();
        complemento = complemento == null ? null : complemento.strip();
    }
}

