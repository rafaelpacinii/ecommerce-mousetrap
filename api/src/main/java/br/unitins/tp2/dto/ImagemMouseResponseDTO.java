package br.unitins.tp2.dto;

import br.unitins.tp2.model.ImagemMouse;

public record ImagemMouseResponseDTO(Long id, String url, String textoAlternativo, Integer ordem) {
    public static ImagemMouseResponseDTO valueOf(ImagemMouse imagem) {
        return new ImagemMouseResponseDTO(imagem.getId(), imagem.getUrl(), imagem.getTextoAlternativo(), imagem.getOrdem());
    }
}
