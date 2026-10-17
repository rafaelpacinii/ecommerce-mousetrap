package br.unitins.tp2.dto;
import br.unitins.tp2.model.Desejo;
public record DesejoResponseDTO(ProdutoResponseDTO produto,boolean disponivel){
    public static DesejoResponseDTO valueOf(Desejo d){var m=d.getMouse();return new DesejoResponseDTO(ProdutoResponseDTO.valueOf(m),Boolean.TRUE.equals(m.getAtivo())&&Boolean.TRUE.equals(m.getMarca().getAtivo()));}
}
