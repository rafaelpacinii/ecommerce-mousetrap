package br.unitins.tp2.dto;

import java.math.BigDecimal;

public record FreteResponseDTO(
        String cep,
        String localidade,
        String uf,
        BigDecimal valorFrete,
        int prazoDiasUteis) {
}

