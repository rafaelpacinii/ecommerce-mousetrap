package br.unitins.tp2.dto;
import java.math.BigDecimal;
import java.time.Instant;
public record IndicadoresPedidoResponseDTO(BigDecimal faturamentoMes,long pedidosPendentes,long mousesAtivos,long clientesCadastrados,Instant inicioMes,Instant fimMes){}
