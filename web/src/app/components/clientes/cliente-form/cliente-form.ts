import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize, Subscription } from 'rxjs';
import { Cliente } from '../../../models/cliente.model';
import { ClienteService } from '../../../services/cliente.service';
import { CepService } from '../../../services/cep.service';
import { mensagemErro, textoObrigatorio } from '../../../services/erro-api';

@Component({
  selector: 'app-cliente-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './cliente-form.html',
  styleUrl: './cliente-form.css',
})
export class ClienteFormComponent {
  private readonly service = inject(ClienteService);
  private readonly cepService = inject(CepService);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private consulta?: Subscription;
  readonly cliente: Cliente | undefined = inject(ActivatedRoute).snapshot.data['cliente'];
  readonly salvando = signal(false);
  readonly consultando = signal(false);
  readonly cepConfirmado = signal('');
  readonly municipio = signal('');
  readonly estado = signal('');
  readonly erroCep = signal('');
  readonly form = this.fb.nonNullable.group({
    nome: [
      '',
      [Validators.required, textoObrigatorio, Validators.minLength(2), Validators.maxLength(100)],
    ],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    cep: ['', [Validators.required, Validators.pattern(/^[0-9]{5}-?[0-9]{3}$/)]],
    logradouro: ['', [Validators.required, textoObrigatorio, Validators.maxLength(200)]],
    bairro: ['', [Validators.required, textoObrigatorio, Validators.maxLength(100)]],
    numero: ['', [Validators.required, textoObrigatorio, Validators.maxLength(20)]],
    complemento: ['', Validators.maxLength(100)],
  });
  constructor() {
    if (this.cliente) {
      this.form.patchValue(this.cliente);
      this.cepConfirmado.set(this.cliente.cep);
      this.municipio.set(this.cliente.municipio.nome);
      this.estado.set(this.cliente.municipio.estado.sigla);
    }
    this.form.controls.cep.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.consulta?.unsubscribe();
      this.cepConfirmado.set('');
      this.municipio.set('');
      this.estado.set('');
      this.erroCep.set('');
      this.form.patchValue({ logradouro: '', bairro: '' });
    });
  }
  consultarCep(): void {
    if (this.salvando()) return;
    const controle = this.form.controls.cep;
    controle.markAsTouched();
    if (controle.invalid) return;
    const cep = controle.value.replace('-', '');
    if (this.cepConfirmado() === cep) return;
    this.consulta?.unsubscribe();
    this.cepConfirmado.set('');
    this.erroCep.set('');
    this.consultando.set(true);
    this.consulta = this.cepService
      .consultar(cep)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.consultando.set(false)),
      )
      .subscribe({
        next: (dados) => {
          this.form.patchValue({ logradouro: dados.logradouro, bairro: dados.bairro });
          this.municipio.set(dados.localidade);
          this.estado.set(dados.uf);
          this.cepConfirmado.set(cep);
        },
        error: (erro: unknown) => this.erroCep.set(mensagemErro(erro)),
      });
  }
  mensagemCampo(campo: keyof typeof this.form.controls): string {
    const controle = this.form.controls[campo];
    if (controle.hasError('required')) return 'Campo obrigatório.';
    if (controle.hasError('email')) return 'Informe um e-mail válido.';
    if (controle.hasError('pattern')) return 'Informe um CEP com oito dígitos.';
    if (controle.hasError('minlength')) return 'Informe pelo menos dois caracteres.';
    if (controle.hasError('maxlength'))
      return `Use no máximo ${controle.errors?.['maxlength'].requiredLength} caracteres.`;
    return 'Revise este campo.';
  }
  salvar(): void {
    if (this.salvando() || this.consultando()) return;
    const dados = this.form.getRawValue();
    this.form.patchValue({
      nome: dados.nome.trim(),
      email: dados.email.trim().toLowerCase(),
      logradouro: dados.logradouro.trim(),
      bairro: dados.bairro.trim(),
      numero: dados.numero.trim(),
      complemento: dados.complemento.trim(),
    });
    if (this.form.invalid || this.cepConfirmado() !== dados.cep.replace('-', '')) {
      this.form.markAllAsTouched();
      if (!this.cepConfirmado()) this.erroCep.set('Consulte o CEP antes de salvar.');
      return;
    }
    const cliente = { ...this.form.getRawValue(), cep: dados.cep.replace('-', '') };
    const requisicao =
      this.cliente?.id != null
        ? this.service.update(this.cliente.id, cliente)
        : this.service.create(cliente);
    this.salvando.set(true);
    this.form.disable({ emitEvent: false });
    requisicao
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.form.enable({ emitEvent: false });
          this.salvando.set(false);
        }),
      )
      .subscribe({
        next: () => {
          this.snack.open('Cliente salvo com sucesso.', 'Fechar', { duration: 4000 });
          void this.router.navigate(['/clientes']);
        },
        error: (erro: unknown) => this.snack.open(mensagemErro(erro), 'Fechar', { duration: 7000 }),
      });
  }
}
