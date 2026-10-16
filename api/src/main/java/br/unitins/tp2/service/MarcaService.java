package br.unitins.tp2.service;

import java.util.List;
import br.unitins.tp2.dto.MarcaDTO;
import br.unitins.tp2.dto.MarcaResponseDTO;

public interface MarcaService {
    List<MarcaResponseDTO> findAll();
    MarcaResponseDTO findById(Long id);
    MarcaResponseDTO create(MarcaDTO dto);
    MarcaResponseDTO update(Long id, MarcaDTO dto);
    void delete(Long id);
}
