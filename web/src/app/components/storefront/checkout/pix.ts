import { create } from 'qrcode';

function campo(id: string, value: string): string {
  return id + String(value.length).padStart(2, '0') + value;
}

export function crc16(value: string): string {
  let crc = 0xffff;
  for (const char of value) {
    crc ^= char.charCodeAt(0) << 8;
    for (let bit = 0; bit < 8; bit++) crc = ((crc << 1) ^ (crc & 0x8000 ? 0x1021 : 0)) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function codigoPix(total: number, pedidoId: number): string {
  if (
    !Number.isFinite(total) ||
    total <= 0 ||
    total > 9999999999.99 ||
    !Number.isSafeInteger(pedidoId) ||
    pedidoId <= 0
  )
    throw new Error('Não foi possível gerar o código PIX deste pedido.');
  // Reserved .invalid domain: this local payment flow never routes money to a beneficiary.
  const conta = campo('00', 'br.gov.bcb.pix') + campo('01', 'pagamentos@mousetrap.invalid');
  const payload =
    campo('00', '01') +
    campo('26', conta) +
    campo('52', '0000') +
    campo('53', '986') +
    campo('54', total.toFixed(2)) +
    campo('58', 'BR') +
    campo('59', 'MOUSETRAP') +
    campo('60', 'PALMAS') +
    campo('62', campo('05', `MT${pedidoId}`)) +
    '6304';
  return payload + crc16(payload);
}

export function matrizPix(payload: string): { tamanho: number; caminho: string } {
  const { modules } = create(payload, { errorCorrectionLevel: 'M' });
  const paths: string[] = [];
  for (let y = 0; y < modules.size; y++)
    for (let x = 0; x < modules.size; x++)
      if (modules.get(y, x)) paths.push(`M${x + 4},${y + 4}h1v1h-1z`);
  return { tamanho: modules.size + 8, caminho: paths.join('') };
}
