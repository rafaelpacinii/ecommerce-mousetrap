package br.unitins.tp2.dto;

import br.unitins.tp2.model.TelefoneCliente;
import br.unitins.tp2.model.TipoTelefone;

public record TelefoneClienteResponseDTO(
        Long id,
        String ddd,
        String numero,
        TipoTelefone tipoTelefone,
        boolean principal) {
    public static TelefoneClienteResponseDTO valueOf(TelefoneCliente telefone) {
        if (telefone == null) {
            return null;
        }
        return new TelefoneClienteResponseDTO(
                telefone.getId(),
                telefone.getDdd(),
                telefone.getNumero(),
                telefone.getTipoTelefone(),
                Boolean.TRUE.equals(telefone.getPrincipal()));
    }
}
