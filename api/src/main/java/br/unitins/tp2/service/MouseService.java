package br.unitins.tp2.service;

import java.util.List;
import br.unitins.tp2.dto.MouseDTO;
import br.unitins.tp2.dto.MouseResponseDTO;

public interface MouseService {
    List<MouseResponseDTO> findAll();
    MouseResponseDTO findById(Long id);
    MouseResponseDTO create(MouseDTO dto);
    MouseResponseDTO update(Long id, MouseDTO dto);
    void delete(Long id);
}
