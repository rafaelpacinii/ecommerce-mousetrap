package br.unitins.tp2.service;
import br.unitins.tp2.dto.*;
public interface PedidoService {
    CheckoutConfiguracaoResponseDTO configuracao();
    RevisaoPedidoResponseDTO revisar(RevisaoPedidoDTO dto);
    PedidoResponseDTO criar(PedidoDTO dto);
    PedidoResponseDTO findById(Long id);
    PedidoResponseDTO pagar(Long id, PagamentoDTO dto);
    PedidoResponseDTO simular(Long id, Long pagamentoId, SimulacaoPagamentoDTO dto);
    PedidoResponseDTO cancelar(Long id);
    void expirarVencidos();
}
