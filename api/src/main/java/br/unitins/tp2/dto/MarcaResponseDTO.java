package br.unitins.tp2.dto;

import br.unitins.tp2.model.Marca;

public record MarcaResponseDTO(
        Long id,
        String nome,
        Boolean ativo,
        String logomarcaUrl,
        PaisResponseDTO paisOrigem,
        String descricao,
        String siteOficial,
        String emailSuporte,
        Integer anoFundacao,
        Integer garantiaPadraoMeses) {
    public static MarcaResponseDTO valueOf(Marca marca) {
        return new MarcaResponseDTO(
                marca.getId(),
                marca.getNome(),
                marca.getAtivo(),
                marca.getLogomarcaUrl(),
                PaisResponseDTO.valueOf(marca.getPaisOrigem()),
                marca.getDescricao(),
                marca.getSiteOficial(),
                marca.getEmailSuporte(),
                marca.getAnoFundacao(),
                marca.getGarantiaPadraoMeses());
    }
}
