package br.unitins.tp2.service;

import java.util.List;
import br.unitins.tp2.dto.MouseDTO;
import br.unitins.tp2.dto.MouseResponseDTO;
import br.unitins.tp2.model.Mouse;

public interface MouseService {
    List<Mouse> findAll(int page, int pageSize);
    List<Mouse> findByNome(String nome, int page, int pageSize);
    long count();
    long count(String nome);
    MouseResponseDTO findById(Long id);
    MouseResponseDTO create(MouseDTO dto);
    MouseResponseDTO update(Long id, MouseDTO dto);
    void delete(Long id);
}
