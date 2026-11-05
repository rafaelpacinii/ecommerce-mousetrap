package br.unitins.tp2.dto;

import java.math.BigDecimal;
import br.unitins.tp2.model.Transportadora;

public record TransportadoraResponseDTO(
        Long id,
        String nome,
        String cnpj,
        String urlRastreioPadrao,
        BigDecimal valorBaseFrete,
        Integer prazoMedioDias) {
    public static TransportadoraResponseDTO valueOf(Transportadora transportadora) {
        if (transportadora == null) {
            return null;
        }
        return new TransportadoraResponseDTO(
                transportadora.getId(),
                transportadora.getNome(),
                transportadora.getCnpj(),
                transportadora.getUrlRastreioPadrao(),
                transportadora.getValorBaseFrete(),
                transportadora.getPrazoMedioDias());
    }
}

