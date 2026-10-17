import { Component, inject, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DesejoService } from '../../../services/desejo.service';
@Component({
  selector: 'app-favorite-button',
  standalone: true,
  imports: [MatIconModule],
  template: `<button
    type="button"
    [attr.aria-label]="
      desejos.ids().includes(id()) ? 'Remover da lista de desejos' : 'Salvar na lista de desejos'
    "
    [attr.aria-pressed]="desejos.ids().includes(id())"
    [disabled]="desejos.carregando() || desejos.pendentes().includes(id())"
    (click)="desejos.alternar(id())"
  >
    <mat-icon aria-hidden="true">{{
      desejos.ids().includes(id()) ? 'favorite' : 'favorite_border'
    }}</mat-icon>
  </button>`,
  styles: `
    :host {
      display: inline-flex;
    }
    button {
      display: grid;
      place-items: center;
      width: 40px;
      height: 40px;
      border: 1px solid var(--neutral-200);
      border-radius: 50%;
      background: var(--surface-pure);
      color: var(--slate-blue);
      cursor: pointer;
    }
    button:disabled {
      opacity: 0.5;
      cursor: wait;
    }
  `,
})
export class FavoriteButtonComponent {
  readonly desejos = inject(DesejoService);
  readonly id = input.required<number>();
}
