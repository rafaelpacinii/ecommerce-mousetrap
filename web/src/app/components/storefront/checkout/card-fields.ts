import { Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormularioCartao } from './cartao.form';

@Component({
  selector: 'app-card-fields',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule],
  template: `
    <div class="card-fields" [formGroup]="form()">
      <mat-form-field appearance="outline">
        <mat-label>Número do cartão</mat-label>
        <input
          matInput
          formControlName="numero"
          inputmode="numeric"
          autocomplete="off"
          maxlength="23"
          placeholder="0000 0000 0000 0000"
        />
        <mat-error>Informe entre 13 e 19 números.</mat-error>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Nome impresso no cartão</mat-label>
        <input matInput formControlName="titular" autocomplete="off" maxlength="100" />
        <mat-error>Informe o nome impresso no cartão.</mat-error>
      </mat-form-field>
      <div class="card-security">
        <mat-form-field appearance="outline">
          <mat-label>Validade</mat-label>
          <input
            matInput
            formControlName="validade"
            inputmode="numeric"
            autocomplete="off"
            maxlength="7"
            placeholder="MM/AA"
          />
          <mat-error>Informe mês e ano válidos.</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>CVV</mat-label>
          <input
            matInput
            formControlName="cvv"
            type="password"
            inputmode="numeric"
            autocomplete="off"
            maxlength="4"
            placeholder="3 ou 4 números"
          />
          <mat-error>Informe 3 ou 4 números.</mat-error>
        </mat-form-field>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      margin-top: 24px;
    }
    .card-fields {
      display: grid;
      gap: 12px;
    }
    .card-security {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
    }
    mat-form-field {
      width: 100%;
      min-width: 0;
    }
    @media (max-width: 400px) {
      .card-security {
        grid-template-columns: minmax(0, 1fr);
      }
    }
  `,
})
export class CardFieldsComponent {
  readonly form = input.required<FormularioCartao>();
}
