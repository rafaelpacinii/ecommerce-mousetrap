package br.unitins.tp2.service;

import br.unitins.tp2.dto.FreteResponseDTO;
import br.unitins.tp2.model.Municipio;

public interface FreteService {
    FreteResponseDTO calcular(String cep, Municipio municipio);
}
