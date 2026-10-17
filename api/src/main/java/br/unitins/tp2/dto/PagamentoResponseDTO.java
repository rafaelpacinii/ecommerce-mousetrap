package br.unitins.tp2.dto;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import br.unitins.tp2.model.*;
public record PagamentoResponseDTO(Long id, UUID chaveIdempotencia, FormaPagamento forma, StatusPagamento status,
        BigDecimal valor, Instant processadoEm) {
    public static PagamentoResponseDTO valueOf(Pagamento p) {
        return new PagamentoResponseDTO(p.getId(), p.getChaveIdempotencia(), p.getForma(), p.getStatus(), p.getValor(), p.getProcessadoEm());
    }
}
