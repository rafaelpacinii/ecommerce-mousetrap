package br.unitins.tp2.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ClienteDTO(
        @NotBlank(message = "Informe o nome do cliente.")
        @Size(min = 2, max = 100, message = "O nome deve ter entre 2 e 100 caracteres.") String nome,
        @NotBlank(message = "Informe o e-mail.")
        @Email(message = "Informe um e-mail válido.")
        @Size(max = 254, message = "O e-mail deve ter no máximo 254 caracteres.") String email,
        @NotBlank(message = "Informe o CEP.")
        @Pattern(regexp = "[0-9]{5}-?[0-9]{3}", message = "Informe um CEP com oito dígitos.") String cep,
        @NotBlank(message = "Informe o logradouro.")
        @Size(max = 200, message = "O logradouro deve ter no máximo 200 caracteres.") String logradouro,
        @NotBlank(message = "Informe o bairro.")
        @Size(max = 100, message = "O bairro deve ter no máximo 100 caracteres.") String bairro,
        @NotBlank(message = "Informe o número ou S/N.")
        @Size(max = 20, message = "O número deve ter no máximo 20 caracteres.") String numero,
        @Size(max = 100, message = "O complemento deve ter no máximo 100 caracteres.") String complemento,
        @Pattern(regexp = "^$|^[0-9]{11}$", message = "Informe um CPF com 11 dígitos numéricos.") String cpf,
        @Past(message = "A data de nascimento deve ser anterior à data atual.") LocalDate dataNascimento,
        @Size(max = 5, message = "Informe no máximo 5 telefones.") List<@Valid TelefoneClienteDTO> telefones,
        @Pattern(regexp = "[0-9]{7}") String codigoIbge) {
    public ClienteDTO(
            String nome,
            String email,
            String cep,
            String logradouro,
            String bairro,
            String numero,
            String complemento) {
        this(nome, email, cep, logradouro, bairro, numero, complemento, null, null, null, null);
    }

    public ClienteDTO(String nome, String email, String cep, String logradouro, String bairro,
            String numero, String complemento, String cpf, LocalDate dataNascimento,
            List<TelefoneClienteDTO> telefones) {
        this(nome, email, cep, logradouro, bairro, numero, complemento, cpf, dataNascimento, telefones, null);
    }

    public ClienteDTO {
        nome = limpar(nome);
        cep = cep == null ? null : cep.replace("-", "");
        email = email == null ? null : email.strip().toLowerCase(Locale.ROOT);
        logradouro = limpar(logradouro);
        bairro = limpar(bairro);
        numero = limpar(numero);
        complemento = limpar(complemento);
        if (cpf != null) {
            cpf = cpf.strip().replaceAll("[.\\-]", "");
        }
    }

    private static String limpar(String valor) {
        return valor == null ? null : valor.strip();
    }
}
