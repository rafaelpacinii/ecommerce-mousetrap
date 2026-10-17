package br.unitins.tp2.dto;
import br.unitins.tp2.model.Cliente;
public record ClienteResponseDTO(Long id, String nome, String email, String cep, String logradouro, String bairro, String numero, String complemento, MunicipioResponseDTO municipio) {
 public static ClienteResponseDTO valueOf(Cliente c) { return new ClienteResponseDTO(c.getId(), c.getNome(), c.getEmail(), c.getCep(), c.getLogradouro(), c.getBairro(), c.getNumero(), c.getComplemento(), MunicipioResponseDTO.valueOf(c.getMunicipio())); }
}
