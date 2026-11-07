import { Component, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { finalize, Subscription } from 'rxjs';
import { Estado } from '../../../models/estado.model';
import { Municipio } from '../../../models/municipio.model';
import { LocalidadeService } from '../../../services/localidade.service';

@Component({
  selector: 'app-localidade-select',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <fieldset [disabled]="bloqueado()">
      <legend>Estado e município</legend>
      @if (erroEstados()) {
        <p role="alert">Não foi possível carregar os estados.</p>
        <button mat-button type="button" (click)="carregarEstados()">Recarregar estados</button>
      }
      @if (carregandoEstados()) {
        <p role="status">Carregando estados…</p>
      }
      <div class="campos">
        <mat-form-field appearance="outline">
          <mat-label>Estado</mat-label>
          <select matNativeControl [value]="uf()" (change)="selecionarEstado($event)" required>
            <option value="">Selecione o estado</option>
            @for (estado of estados(); track estado.sigla) {
              <option [value]="estado.sigla">{{ estado.nome }} ({{ estado.sigla }})</option>
            }
          </select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Município</mat-label>
          <select matNativeControl [formControl]="codigo()" (change)="alterado.emit()" required>
            <option value="">
              {{ uf() ? 'Selecione o município' : 'Selecione primeiro o estado' }}
            </option>
            @for (municipio of municipios(); track municipio.codigoIbge) {
              <option [value]="municipio.codigoIbge">{{ municipio.nome }}</option>
            }
          </select>
          <mat-error>Selecione um município.</mat-error>
        </mat-form-field>
      </div>
      @if (carregandoMunicipios()) {
        <p role="status">Carregando municípios…</p>
      }
      @if (erroMunicipios()) {
        <p role="alert">{{ erroMunicipios() }}</p>
        <button mat-button type="button" (click)="carregarMunicipios()">
          Recarregar municípios
        </button>
      }
    </fieldset>
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }
    fieldset {
      border: 0;
      padding: 0;
      margin: 0;
      min-width: 0;
    }
    legend {
      font-size: 14px;
      margin-bottom: 12px;
    }
    .campos {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
      gap: 12px;
    }
    mat-form-field {
      min-width: 0;
      width: 100%;
    }
    select {
      text-overflow: ellipsis;
    }
  `,
})
export class LocalidadeSelectComponent {
  readonly codigo = input.required<FormControl<string>>();
  readonly uf = input('');
  readonly bloqueado = input(false);
  readonly ufChange = output<string>();
  readonly alterado = output<void>();
  readonly estados = signal<Estado[]>([]);
  readonly municipios = signal<Municipio[]>([]);
  readonly carregandoEstados = signal(false);
  readonly carregandoMunicipios = signal(false);
  readonly erroEstados = signal(false);
  readonly erroMunicipios = signal('');
  private readonly service = inject(LocalidadeService);
  private readonly destroyRef = inject(DestroyRef);
  private consulta?: Subscription;

  constructor() {
    this.carregarEstados();
    effect(() => this.carregarMunicipios(this.uf()));
  }

  carregarEstados(): void {
    if (this.carregandoEstados()) return;
    this.carregandoEstados.set(true);
    this.erroEstados.set(false);
    this.service
      .estados()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.carregandoEstados.set(false)),
      )
      .subscribe({
        next: (estados) => this.estados.set(estados),
        error: () => this.erroEstados.set(true),
      });
  }

  selecionarEstado(event: Event): void {
    this.codigo().setValue('');
    this.codigo().markAsTouched();
    this.alterado.emit();
    this.ufChange.emit((event.target as HTMLSelectElement).value);
  }

  carregarMunicipios(uf = this.uf()): void {
    this.consulta?.unsubscribe();
    this.municipios.set([]);
    this.erroMunicipios.set('');
    if (!uf) return;
    this.carregandoMunicipios.set(true);
    this.consulta = this.service
      .municipios(uf)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.carregandoMunicipios.set(false)),
      )
      .subscribe({
        next: (municipios) => {
          this.municipios.set(municipios);
          if (!municipios.length)
            this.erroMunicipios.set('Nenhum município disponível para este estado.');
          if (
            this.codigo().value &&
            !municipios.some((m) => m.codigoIbge === this.codigo().value)
          ) {
            this.codigo().setValue('');
            this.erroMunicipios.set('Selecione um município da lista para continuar.');
          }
        },
        error: () =>
          this.erroMunicipios.set('Não foi possível carregar os municípios. Tente novamente.'),
      });
  }
}
