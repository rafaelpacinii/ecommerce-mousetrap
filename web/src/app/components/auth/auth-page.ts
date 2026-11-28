import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { finalize, Subscription } from 'rxjs';
import { LocalidadeSelectComponent } from '../shared/localidade-select/localidade-select';
import { AuthService, safeReturnUrl } from '../../services/auth.service';
import { CepService } from '../../services/cep.service';
import { mensagemErro, textoObrigatorio } from '../../services/erro-api';
import { CadastroPayload } from '../../models/auth.model';

function senhasIguaisValidator(group: AbstractControl): ValidationErrors | null {
  const senha = group.get('senha')?.value ?? '';
  const confirmar = group.get('confirmarSenha')?.value ?? '';
  if (!confirmar) return null;
  return senha === confirmar ? null : { senhasDiferentes: true };
}

@Component({
  selector: 'app-auth-page',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    LocalidadeSelectComponent,
  ],
  templateUrl: './auth-page.html',
  styleUrl: './auth-page.css',
})
export class AuthPageComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly cepService = inject(CepService);
  private readonly destroyRef = inject(DestroyRef);
  private consultaCep?: Subscription;

  readonly mode = this.route.snapshot.data['mode'] as string;
  readonly returnUrl = safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));
  readonly expired = this.route.snapshot.queryParamMap.has('expired');

  readonly ocultarSenhaLogin = signal(true);
  readonly ocultarSenhaCadastro = signal(true);
  readonly incluirEndereco = signal(false);
  readonly consultandoCep = signal(false);
  readonly erroCep = signal('');
  readonly estado = signal('');

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    senha: ['', [Validators.required, Validators.maxLength(256)]],
  });

  readonly cadastroForm = this.fb.nonNullable.group(
    {
      nome: [
        '',
        [
          Validators.required,
          textoObrigatorio,
          Validators.minLength(2),
          Validators.maxLength(100),
        ],
      ],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
      telefone: ['', [Validators.pattern(/^(?:|\(?\d{2}\)?\s?\d{4,5}-?\d{4})$/)]],
      senha: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(128),
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/),
        ],
      ],
      confirmarSenha: ['', [Validators.required]],
      cep: [''],
      codigoIbge: [''],
      logradouro: [''],
      bairro: [''],
      numero: [''],
      complemento: ['', [Validators.maxLength(100)]],
    },
    { validators: senhasIguaisValidator },
  );

  ngOnInit(): void {
    this.auth.error.set('');
    if (this.auth.authenticated() && this.mode !== 'acesso-negado') {
      void this.router.navigateByUrl(
        this.returnUrl ?? (this.auth.admin() ? '/admin/pedidos' : '/'),
        { replaceUrl: true },
      );
    }
  }

  alternarEndereco(ativo: boolean): void {
    this.incluirEndereco.set(ativo);
    this.erroCep.set('');
    const { cep, codigoIbge, logradouro, bairro, numero } = this.cadastroForm.controls;
    if (ativo) {
      cep.setValidators([Validators.required, Validators.pattern(/^[0-9]{5}-?[0-9]{3}$/)]);
      codigoIbge.setValidators([Validators.required, Validators.pattern(/^[0-9]{7}$/)]);
      logradouro.setValidators([Validators.required, textoObrigatorio, Validators.maxLength(200)]);
      bairro.setValidators([Validators.required, textoObrigatorio, Validators.maxLength(100)]);
      numero.setValidators([Validators.required, textoObrigatorio, Validators.maxLength(20)]);
    } else {
      for (const ctrl of [cep, codigoIbge, logradouro, bairro, numero]) {
        ctrl.clearValidators();
      }
    }
    for (const ctrl of [cep, codigoIbge, logradouro, bairro, numero]) {
      ctrl.updateValueAndValidity({ emitEvent: false });
    }
  }

  consultarCep(): void {
    if (this.auth.redirecting() || this.consultandoCep()) return;
    const ctrl = this.cadastroForm.controls.cep;
    ctrl.markAsTouched();
    if (ctrl.invalid) return;
    const cepLimpo = ctrl.value.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return;
    this.consultaCep?.unsubscribe();
    this.erroCep.set('');
    this.consultandoCep.set(true);
    this.consultaCep = this.cepService
      .consultar(cepLimpo)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.consultandoCep.set(false)),
      )
      .subscribe({
        next: (dados) => {
          this.cadastroForm.patchValue(
            {
              logradouro: dados.logradouro,
              bairro: dados.bairro,
              codigoIbge: dados.ibge,
            },
            { emitEvent: false },
          );
          this.estado.set(dados.uf);
        },
        error: (erro: unknown) => this.erroCep.set(mensagemErro(erro)),
      });
  }

  async submeterLogin(): Promise<void> {
    if (this.auth.redirecting()) return;
    const raw = this.loginForm.getRawValue();
    this.loginForm.patchValue({ email: raw.email.trim().toLowerCase() }, { emitEvent: false });
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    try {
      const destino = await this.auth.entrar(this.loginForm.getRawValue(), this.returnUrl);
      if (destino) {
        await this.router.navigateByUrl(destino, { replaceUrl: true });
      }
    } catch {
      // Error signal is populated by AuthService.
    }
  }

  async submeterCadastro(): Promise<void> {
    if (this.auth.redirecting() || this.consultandoCep()) return;
    const raw = this.cadastroForm.getRawValue();
    this.cadastroForm.patchValue(
      {
        nome: raw.nome.trim(),
        email: raw.email.trim().toLowerCase(),
        telefone: raw.telefone.trim(),
        logradouro: raw.logradouro.trim(),
        bairro: raw.bairro.trim(),
        numero: raw.numero.trim(),
        complemento: raw.complemento.trim(),
      },
      { emitEvent: false },
    );
    if (this.cadastroForm.invalid) {
      this.cadastroForm.markAllAsTouched();
      return;
    }
    const valores = this.cadastroForm.getRawValue();
    const telDigitos = valores.telefone.replace(/\D/g, '');
    const payload: CadastroPayload = {
      nome: valores.nome,
      email: valores.email,
      senha: valores.senha,
      ...(telDigitos ? { telefone: telDigitos } : {}),
      ...(this.incluirEndereco()
        ? {
            cep: valores.cep.replace(/\D/g, ''),
            codigoIbge: valores.codigoIbge,
            logradouro: valores.logradouro,
            bairro: valores.bairro,
            numero: valores.numero,
            complemento: valores.complemento,
          }
        : {}),
    };
    try {
      const destino = await this.auth.cadastrar(payload, this.returnUrl);
      if (destino) {
        await this.router.navigateByUrl(destino, { replaceUrl: true });
      }
    } catch {
      // Error signal is populated by AuthService.
    }
  }

  erroLogin(campo: 'email' | 'senha'): string {
    const ctrl = this.loginForm.controls[campo];
    if (ctrl.hasError('required')) return 'Campo obrigatório.';
    if (ctrl.hasError('email')) return 'Informe um e-mail válido.';
    return 'Revise este campo.';
  }

  erroCadastro(campo: keyof typeof this.cadastroForm.controls): string {
    const ctrl = this.cadastroForm.controls[campo];
    if (ctrl.hasError('required')) return 'Campo obrigatório.';
    if (ctrl.hasError('email')) return 'Informe um e-mail válido.';
    if (campo === 'senha') {
      if (ctrl.hasError('minlength')) return 'Use pelo menos 8 caracteres.';
      if (ctrl.hasError('pattern')) return 'Inclua letras maiúsculas, minúsculas e números.';
    }
    if (campo === 'telefone' && ctrl.hasError('pattern')) {
      return 'Informe DDD e telefone com 10 ou 11 dígitos.';
    }
    if (campo === 'cep' && ctrl.hasError('pattern')) {
      return 'Informe um CEP com oito dígitos.';
    }
    if (ctrl.hasError('minlength')) return 'Informe pelo menos dois caracteres.';
    if (ctrl.hasError('maxlength')) {
      return `Use no máximo ${ctrl.errors?.['maxlength'].requiredLength} caracteres.`;
    }
    return 'Revise este campo.';
  }
}
