package br.unitins.tp2.dto;

import java.util.List;

public record UsuarioAutenticadoDTO(
        String subject,
        String nome,
        String email,
        List<String> roles,
        boolean perfilCompleto) {
}
