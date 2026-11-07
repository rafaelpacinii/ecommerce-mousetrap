package br.unitins.tp2.dto;

import java.time.LocalDate;
import java.util.List;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record PerfilClienteDTO(
        @NotBlank @Size(min = 2, max = 100) String nome,
        @NotBlank @Pattern(regexp = "[0-9]{5}-?[0-9]{3}") String cep,
        @NotBlank @Size(max = 200) String logradouro,
        @NotBlank @Size(max = 100) String bairro,
        @NotBlank @Size(max = 20) String numero,
        @Size(max = 100) String complemento,
        @Pattern(regexp = "^$|^[0-9]{11}$", message = "Informe um CPF com 11 dígitos numéricos.") String cpf,
        @Past(message = "A data de nascimento deve ser anterior à data atual.") LocalDate dataNascimento,
        @Size(max = 5, message = "Informe no máximo 5 telefones.") List<@Valid TelefoneClienteDTO> telefones,
        @Pattern(regexp = "[0-9]{7}") String codigoIbge) {
    public PerfilClienteDTO {
        nome = nome == null ? null : nome.strip();
        cep = cep == null ? null : cep.replace("-", "");
        logradouro = logradouro == null ? null : logradouro.strip();
        bairro = bairro == null ? null : bairro.strip();
        numero = numero == null ? null : numero.strip();
        complemento = complemento == null ? null : complemento.strip();
        if (cpf != null) {
            cpf = cpf.strip().replaceAll("[.\\-]", "");
        }
    }

    public ClienteDTO comEmail(String email) {
        return new ClienteDTO(nome, email, cep, logradouro, bairro, numero, complemento, cpf, dataNascimento, telefones, codigoIbge);
    }
}
