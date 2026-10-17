package br.unitins.tp2.service;

import br.unitins.tp2.dto.CepResponseDTO;
import br.unitins.tp2.dto.FreteResponseDTO;

public interface CepService {
    CepResponseDTO consultar(String cep);
    FreteResponseDTO calcularFrete(String cep);
}

