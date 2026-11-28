package br.unitins.tp2.dto;

public record SessaoAuthResponseDTO(
        String accessToken,
        long expiresIn,
        UsuarioAutenticadoDTO usuario) {
}
