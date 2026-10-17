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
    PageResponse<PedidoResponseDTO> meusPedidos(int page,int pageSize);
    PageResponse<PedidoResumoResponseDTO> listarAdmin(String busca,Integer status,String ordenar,int page,int pageSize);
    PedidoAdminResponseDTO detalheAdmin(Long id);
    IndicadoresPedidoResponseDTO indicadores();
    PedidoAdminResponseDTO decidirPagamento(Long id,Long pagamentoId,DecisaoPagamentoDTO dto);
    PedidoAdminResponseDTO enviar(Long id,EnvioPedidoDTO dto);
    PedidoAdminResponseDTO entregar(Long id,OperacaoPedidoDTO dto);
    PedidoAdminResponseDTO cancelarAdmin(Long id,OperacaoPedidoDTO dto);
    void expirarVencidos();
}
