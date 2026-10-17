import { PedidoAdmin } from '../app/models/pedido.model';
export const pedidoAdmin: PedidoAdmin = {
  idCliente: 8,
  cliente: 'Cliente',
  email: 'cliente@example.test',
  pedido: {
    id: 51,
    chaveCheckout: '00000000-0000-4000-8000-000000000051',
    status: { id: 1, label: 'Aguardando pagamento' },
    criadoEm: '2026-10-17T12:00:00Z',
    expiraEm: '2026-10-17T12:30:00Z',
    endereco: {
      destinatario: 'Cliente',
      cep: '01001000',
      logradouro: 'Praça da Sé',
      bairro: 'Sé',
      numero: '10',
      municipio: 'São Paulo',
      uf: 'SP',
    },
    itens: [
      {
        idMouse: 10,
        sku: 'M10',
        nome: 'Mouse',
        marca: 'Marca',
        cor: 'Preto',
        quantidade: 1,
        precoUnitario: 100,
        subtotal: 100,
      },
    ],
    subtotal: 100,
    frete: 29.9,
    prazoDiasUteis: 5,
    total: 129.9,
    versao: 4,
    eventos: [],
    pagamentos: [
      {
        id: 7,
        chaveIdempotencia: '00000000-0000-4000-8000-000000000007',
        forma: { id: 1, label: 'PIX' },
        status: { id: 1, label: 'Pendente' },
        valor: 129.9,
      },
    ],
  },
};
