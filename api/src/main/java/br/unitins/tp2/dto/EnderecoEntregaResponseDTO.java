package br.unitins.tp2.dto;
import br.unitins.tp2.model.EnderecoEntrega;
public record EnderecoEntregaResponseDTO(String destinatario, String cep, String logradouro, String bairro,
        String numero, String complemento, String municipio, String uf) {
    public static EnderecoEntregaResponseDTO valueOf(EnderecoEntrega e) {
        return new EnderecoEntregaResponseDTO(e.getDestinatario(), e.getCep(), e.getLogradouro(), e.getBairro(),
            e.getNumero(), e.getComplemento(), e.getMunicipio(), e.getUf());
    }
}
