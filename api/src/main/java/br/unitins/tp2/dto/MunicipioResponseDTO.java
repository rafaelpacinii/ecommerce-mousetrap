package br.unitins.tp2.dto;
import br.unitins.tp2.model.Municipio;
public record MunicipioResponseDTO(Long id, String nome, String codigoIbge, EstadoResponseDTO estado) {
 public static MunicipioResponseDTO valueOf(Municipio m) { return new MunicipioResponseDTO(m.getId(), m.getNome(), m.getCodigoIbge(), EstadoResponseDTO.valueOf(m.getEstado())); }
}
