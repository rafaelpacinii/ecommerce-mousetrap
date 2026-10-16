package br.unitins.tp2.service;

import br.unitins.tp2.dto.MarcaDTO;
import br.unitins.tp2.dto.MarcaResponseDTO;
import br.unitins.tp2.model.Marca;
import java.util.List;

public interface MarcaService {
    List<Marca> findAll(int page, int pageSize);
    List<Marca> findByNome(String nome, int page, int pageSize);
    long count();
    long count(String nome);
    MarcaResponseDTO findById(Long id);
    MarcaResponseDTO create(MarcaDTO dto);
    MarcaResponseDTO update(Long id, MarcaDTO dto);
    void delete(Long id);
}
