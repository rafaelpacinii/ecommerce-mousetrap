package br.unitins.tp2.service;

import java.util.List;
import br.unitins.tp2.dto.*;

public interface ClienteService {
    ClienteResponseDTO findMe();
    ClienteResponseDTO saveMe(PerfilClienteDTO dto);
    ClienteResponseDTO vincularIdentidade(Long id, VinculoClienteDTO dto);
    List<EnderecoResponseDTO> listarMeusEnderecos();
    EnderecoResponseDTO criarMeuEndereco(EnderecoDTO dto);
    EnderecoResponseDTO atualizarMeuEndereco(Long id, EnderecoDTO dto);
    EnderecoResponseDTO definirMeuEnderecoPrincipal(Long id);
    void removerMeuEndereco(Long id);
    List<ClienteResponseDTO> findAll();
    ClienteResponseDTO findById(Long id);
    ClienteResponseDTO create(ClienteDTO dto);
    ClienteResponseDTO update(Long id, ClienteDTO dto);
    void delete(Long id);
}

