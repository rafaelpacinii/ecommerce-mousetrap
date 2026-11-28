package br.unitins.tp2.service;

import br.unitins.tp2.dto.CadastroContaDTO;
import br.unitins.tp2.dto.LoginDTO;
import br.unitins.tp2.dto.SessaoAuthResponseDTO;
import br.unitins.tp2.dto.UsuarioAutenticadoDTO;

public interface AuthService {
    record ResultadoSessao(
            SessaoAuthResponseDTO resposta,
            String refreshToken,
            long refreshExpiresIn) {
    }

    ResultadoSessao login(LoginDTO dto);

    ResultadoSessao cadastrar(CadastroContaDTO dto);

    ResultadoSessao renovar(String refreshToken);

    UsuarioAutenticadoDTO usuarioAtual();

    void logout(String refreshToken);
}
