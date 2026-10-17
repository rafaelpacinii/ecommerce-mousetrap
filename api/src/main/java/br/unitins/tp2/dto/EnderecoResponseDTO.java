package br.unitins.tp2.dto;

import br.unitins.tp2.model.Endereco;

public record EnderecoResponseDTO(
        Long id,
        String apelido,
        String destinatario,
        String cep,
        String logradouro,
        String bairro,
        String numero,
        String complemento,
        boolean principal,
        MunicipioResponseDTO municipio) {
    public static EnderecoResponseDTO valueOf(Endereco e) {
        return new EnderecoResponseDTO(
                e.getId(),
                e.getApelido(),
                e.getDestinatario(),
                e.getCep(),
                e.getLogradouro(),
                e.getBairro(),
                e.getNumero(),
                e.getComplemento(),
                e.isPrincipal(),
                MunicipioResponseDTO.valueOf(e.getMunicipio()));
    }
}

