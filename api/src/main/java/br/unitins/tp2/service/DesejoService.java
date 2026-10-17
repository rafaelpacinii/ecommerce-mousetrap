package br.unitins.tp2.service;
import java.util.List;
import br.unitins.tp2.dto.*;
public interface DesejoService {
    List<Long> ids();
    PageResponse<DesejoResponseDTO> listar(int page,int pageSize);
    void adicionar(Long idMouse);
    void remover(Long idMouse);
}
