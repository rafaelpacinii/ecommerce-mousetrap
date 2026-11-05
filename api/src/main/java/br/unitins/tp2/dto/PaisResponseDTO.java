package br.unitins.tp2.dto;

import br.unitins.tp2.model.Pais;

public record PaisResponseDTO(Long id, String nome, String siglaIso) {
    public static PaisResponseDTO valueOf(Pais pais) {
        if (pais == null) {
            return null;
        }
        return new PaisResponseDTO(pais.getId(), pais.getNome(), pais.getSiglaIso());
    }
}

