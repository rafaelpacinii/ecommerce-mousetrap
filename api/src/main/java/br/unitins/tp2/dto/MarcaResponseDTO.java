package br.unitins.tp2.dto;

import br.unitins.tp2.model.Marca;

public record MarcaResponseDTO(Long id, String nome, Boolean ativo) {
    public static MarcaResponseDTO valueOf(Marca marca) {
        return new MarcaResponseDTO(marca.getId(), marca.getNome(), marca.getAtivo());
    }
}
