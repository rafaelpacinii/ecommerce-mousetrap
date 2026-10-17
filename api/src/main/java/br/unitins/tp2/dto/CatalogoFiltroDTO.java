package br.unitins.tp2.dto;

import java.math.BigDecimal;
import java.util.List;

public record CatalogoFiltroDTO(String nome, List<Long> marcas, String sensor, List<Integer> conexoes,
        List<Integer> pegadas, Integer pollingRateMin, Integer tipoSwitch, BigDecimal pesoMax,
        BigDecimal precoMin, BigDecimal precoMax, boolean emEstoque, String ordenar, int page, int pageSize) {}
