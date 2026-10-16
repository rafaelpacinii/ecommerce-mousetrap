package br.unitins.tp2.dto;
import br.unitins.tp2.model.Estado;
public record EstadoResponseDTO(Long id, String nome, String sigla) {
 public static EstadoResponseDTO valueOf(Estado e) { return new EstadoResponseDTO(e.getId(), e.getNome(), e.getSigla()); }
}
