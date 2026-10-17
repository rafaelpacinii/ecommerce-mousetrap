import { FormControl } from '@angular/forms';
import { criarFormularioCartao, numeroCartao, validadeCartao } from './cartao.form';
import { codigoPix, crc16, matrizPix } from './pix';

describe('Local card validation', () => {
  it.each(['1234567890123', '1234 5678 9012 3456', '1234567890123456789'])(
    'accepts supported number lengths without requiring an existing card: %s',
    (numero) => {
      expect(numeroCartao(new FormControl(numero))).toBeNull();
    },
  );
  it.each(['123456789012', '12345678901234567890', '1234567890123x', ''])(
    'rejects malformed numbers: %s',
    (numero) => {
      expect(numeroCartao(new FormControl(numero))).not.toBeNull();
    },
  );
  it('validates expiry through the end of the current month', () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date(2026, 9, 17));
      for (const value of ['10/26', '10/2026', '11/26'])
        expect(validadeCartao(new FormControl(value))).toBeNull();
      for (const value of ['09/26', '13/26', '00/27', '1/27', ''])
        expect(validadeCartao(new FormControl(value))).not.toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
  it('requires all fields and rejects malformed holder names and CVVs', () => {
    const form = criarFormularioCartao();
    expect(form.invalid).toBe(true);
    form.setValue({
      numero: '1234567890123456',
      titular: 'João da Silva',
      validade: '12/99',
      cvv: '123',
    });
    expect(form.valid).toBe(true);
    form.controls.cvv.setValue('1234');
    expect(form.valid).toBe(true);
    for (const value of ['12', '12345', 'abc']) {
      form.controls.cvv.setValue(value);
      expect(form.controls.cvv.invalid).toBe(true);
    }
    for (const value of [' ', '123456', 'A']) {
      form.controls.titular.setValue(value);
      expect(form.controls.titular.invalid).toBe(true);
    }
  });
});

describe('PIX BR Code', () => {
  function campos(payload: string): Record<string, string> {
    const result: Record<string, string> = {};
    for (let offset = 0; offset < payload.length;) {
      const length = Number(payload.slice(offset + 2, offset + 4));
      result[payload.slice(offset, offset + 2)] = payload.slice(offset + 4, offset + 4 + length);
      offset += 4 + length;
    }
    return result;
  }
  it('matches the official BCB CRC reference vector', () => {
    const reference =
      '00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***6304';
    expect(crc16(reference)).toBe('1D3D');
    expect(crc16('123456789')).toBe('29B1');
  });
  it.each([0.01, 129.9, 1000.05])(
    'encodes the exact final amount, merchant and order reference: %s',
    (total) => {
      const payload = codigoPix(total, 51);
      const values = campos(payload);
      expect(values['54']).toBe(total.toFixed(2));
      expect(values['53']).toBe('986');
      expect(values['58']).toBe('BR');
      expect(campos(values['26'])['00']).toBe('br.gov.bcb.pix');
      expect(campos(values['26'])['01']).toBe('pagamentos@mousetrap.invalid');
      expect(campos(values['62'])['05']).toBe('MT51');
      expect(values['63']).toBe(crc16(payload.slice(0, -4)));
      expect(codigoPix(total, 51)).toBe(payload);
      const qr = matrizPix(payload);
      expect(qr.tamanho).toBeGreaterThan(28);
      expect(qr.caminho.length).toBeGreaterThan(100);
    },
  );
  it('does not encode invalid amounts or order identifiers', () => {
    for (const total of [NaN, Infinity, 0, -1, 1e15]) expect(() => codigoPix(total, 1)).toThrow();
    expect(() => codigoPix(10, 0)).toThrow();
  });
});
