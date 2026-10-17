import { Component, input, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ImagemMouse } from '../../../models/mouse.model';

@Component({
  selector: 'app-product-image',
  standalone: true,
  imports: [MatIconModule],
  template: `
    @if (imagem()?.url && urlComErro() !== imagem()?.url) {
      <img
        [src]="imagem()!.url"
        [alt]="imagem()!.textoAlternativo"
        width="800"
        height="600"
        [attr.loading]="prioritaria() ? 'eager' : 'lazy'"
        [attr.fetchpriority]="prioritaria() ? 'high' : 'auto'"
        (error)="urlComErro.set(imagem()!.url)"
      />
    } @else {
      <div class="fallback" role="img" [attr.aria-label]="'Imagem de ' + nome() + ' indisponível'">
        <mat-icon aria-hidden="true">image_not_supported</mat-icon>
        @if (!compacta()) {
          <span>Imagem indisponível</span>
        }
      </div>
    }
  `,
  styles: `
    :host {
      display: grid;
      width: 100%;
      height: 100%;
      min-height: inherit;
      place-items: center;
    }
    img {
      display: block;
      width: 100%;
      height: 100%;
      max-height: 560px;
      object-fit: contain;
    }
    .fallback {
      display: grid;
      justify-items: center;
      gap: 12px;
      padding: 16px;
      text-align: center;
      color: var(--neutral-500);
    }
    .fallback mat-icon {
      width: 48px;
      height: 48px;
      font-size: 48px;
    }
    .fallback span {
      font-size: 11px;
    }
  `,
})
export class ProductImageComponent {
  readonly imagem = input<ImagemMouse | undefined>();
  readonly nome = input('produto');
  readonly prioritaria = input(false);
  readonly compacta = input(false);
  readonly urlComErro = signal('');
}
