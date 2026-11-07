package br.unitins.tp2.service;

import java.util.List;
import br.unitins.tp2.dto.EstadoResponseDTO;
import br.unitins.tp2.dto.MunicipioResponseDTO;

public interface LocalidadeService {
    List<EstadoResponseDTO> estados();
    List<MunicipioResponseDTO> municipios(String uf);
}
