import { CurrencyPipe } from '@angular/common';
import { Component, computed, input, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { codigoPix, matrizPix } from './pix';

@Component({
  selector: 'app-pix-payment',
  standalone: true,
  imports: [CurrencyPipe, MatIconModule],
  template: `
    <div class="pix-payment">
      <p>
        Valor do PIX: <strong>{{ total() | currency: 'BRL' }}</strong>
      </p>
      <p>Escaneie o QR Code com o aplicativo do seu banco ou use o código abaixo.</p>
      <svg
        class="pix-qr"
        [attr.viewBox]="'0 0 ' + qr().tamanho + ' ' + qr().tamanho"
        role="img"
        aria-label="QR Code PIX do pedido"
        shape-rendering="crispEdges"
      >
        <rect width="100%" height="100%" fill="#fff" />
        <path [attr.d]="qr().caminho" fill="#000" />
      </svg>
      <label [for]="'pix-code-' + pedidoId()">PIX Copia e Cola</label>
      <textarea
        [id]="'pix-code-' + pedidoId()"
        readonly
        [value]="codigo()"
        rows="4"
        spellcheck="false"
        (focus)="selecionar($event)"
      ></textarea>
      <button class="store-button store-button-dark" type="button" (click)="copiar()">
        <mat-icon aria-hidden="true">content_copy</mat-icon>Copiar código PIX
      </button>
      <p role="status">{{ mensagem() }}</p>
    </div>
  `,
  styles: `
    .pix-payment {
      display: grid;
      justify-items: start;
      gap: 12px;
    }
    p {
      margin: 0;
      line-height: 1.6;
    }
    .pix-qr {
      display: block;
      width: 248px;
      max-width: 100%;
      height: auto;
      justify-self: center;
    }
    label {
      font-size: 13px;
      font-weight: 700;
    }
    textarea {
      box-sizing: border-box;
      width: 100%;
      min-width: 0;
      resize: vertical;
      padding: 12px;
      border: 1px solid var(--neutral-200);
      border-radius: 10px;
      background: var(--surface-pure);
      color: var(--neutral-700);
      font: 12px var(--font-mono);
      overflow-wrap: anywhere;
      word-break: break-all;
    }
    [role='status'] {
      color: var(--neutral-500);
      font-size: 13px;
    }
  `,
})
export class PixPaymentComponent {
  readonly total = input.required<number>();
  readonly pedidoId = input.required<number>();
  readonly codigo = computed(() => codigoPix(this.total(), this.pedidoId()));
  readonly qr = computed(() => matrizPix(this.codigo()));
  readonly mensagem = signal('');

  selecionar(event: Event): void {
    (event.target as HTMLTextAreaElement).select();
  }
  async copiar(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.codigo());
      this.mensagem.set('Código PIX copiado.');
    } catch {
      this.mensagem.set('Selecione o código acima e copie para continuar.');
    }
  }
}
