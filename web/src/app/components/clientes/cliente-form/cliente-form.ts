import { MatIconModule } from '@angular/material/icon';
import { NgTemplateOutlet } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService, safeReturnUrl } from '../../../services/auth.service';
import { finalize, Subscription } from 'rxjs';
import { Cliente, Endereco } from '../../../models/cliente.model';
import { ClienteService } from '../../../services/cliente.service';
import { CepService } from '../../../services/cep.service';
import { mensagemErro, textoObrigatorio } from '../../../services/erro-api';

@Component({
  selector: 'app-cliente-form',
  standalone: true,
  imports: [
    MatIconModule,
    NgTemplateOutlet,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './cliente-form.html',
  styleUrl: './cliente-form.css',
})
export class ClienteFormComponent {
  private readonly service = inject(ClienteService);
  private readonly cepService = inject(CepService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private consulta?: Subscription;
  private consultaEndereco?: Subscription;
  readonly auth = inject(AuthService);
  readonly selfService = !!this.route.snapshot.data['selfService'];
  readonly returnUrl = safeReturnUrl(this.route.snapshot.queryParamMap?.get('returnUrl'));
  readonly carregando = signal(false);
  readonly erroPerfil = signal('');
  readonly perfilSalvo = signal(false);
  readonly paginaEnderecos = signal(false);
  readonly avisoPerfil = signal('');
  readonly nomeOriginal = signal('');
  readonly cliente: Cliente | undefined = this.route.snapshot.data['cliente'];
  readonly salvando = signal(false);
  readonly consultando = signal(false);
  readonly cepConfirmado = signal('');
  readonly municipio = signal('');
  readonly estado = signal('');
  readonly erroCep = signal('');

  readonly enderecos = signal<Endereco[]>([]);
  readonly carregandoEnderecos = signal(false);
  readonly erroEnderecos = signal('');
  readonly exibindoFormEndereco = signal(false);
  readonly enderecoEditandoId = signal<number | null>(null);
  readonly salvandoEndereco = signal(false);
  readonly consultandoCepEndereco = signal(false);
  readonly cepEnderecoConfirmado = signal('');
  readonly municipioEndereco = signal('');
  readonly estadoEndereco = signal('');
  readonly erroCepEndereco = signal('');
  readonly enderecosBloqueados = computed(
    () =>
      this.salvando() ||
      this.salvandoEndereco() ||
      this.carregandoEnderecos() ||
      !!this.erroEnderecos(),
  );

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

  readonly formEndereco = this.fb.nonNullable.group({
    apelido: [
      'Casa',
      [Validators.required, textoObrigatorio, Validators.minLength(2), Validators.maxLength(60)],
    ],
    destinatario: ['', [Validators.maxLength(100)]],
    cep: ['', [Validators.required, Validators.pattern(/^[0-9]{5}-?[0-9]{3}$/)]],
    logradouro: ['', [Validators.required, textoObrigatorio, Validators.maxLength(200)]],
    bairro: ['', [Validators.required, textoObrigatorio, Validators.maxLength(100)]],
    numero: ['', [Validators.required, textoObrigatorio, Validators.maxLength(20)]],
    complemento: ['', Validators.maxLength(100)],
    principal: [false],
  });

  constructor() {
    if (this.selfService) {
      this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
        this.paginaEnderecos.set(params.get('secao') === 'enderecos');
      });
      this.carregarPerfil();
    }
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
    this.formEndereco.controls.cep.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.consultaEndereco?.unsubscribe();
        this.cepEnderecoConfirmado.set('');
        this.municipioEndereco.set('');
        this.estadoEndereco.set('');
        this.erroCepEndereco.set('');
        this.formEndereco.patchValue({ logradouro: '', bairro: '' });
      });
  }

  private abrirPagina(enderecos: boolean): void {
    this.paginaEnderecos.set(enderecos);
    void this.router.navigate([enderecos ? '/enderecos' : '/meus-dados'], {
      queryParamsHandling: 'preserve',
    });
  }

  carregarPerfil(): void {
    this.carregando.set(true);
    this.erroPerfil.set('');
    this.service
      .findMe()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.carregando.set(false)),
      )
      .subscribe({
        next: (cliente) => {
          this.perfilSalvo.set(true);
          this.nomeOriginal.set(cliente.nome);
          this.form.patchValue({ ...cliente, email: this.auth.email() }, { emitEvent: false });
          this.cepConfirmado.set(cliente.cep);
          this.municipio.set(cliente.municipio.nome);
          this.estado.set(cliente.municipio.estado.sigla);
          this.carregarEnderecos();
        },
        error: (error: unknown) => {
          if (error instanceof HttpErrorResponse && error.status === 404) {
            this.perfilSalvo.set(false);
            this.nomeOriginal.set(this.auth.nome());
            this.form.patchValue({ nome: this.auth.nome(), email: this.auth.email() });
          } else this.erroPerfil.set(mensagemErro(error));
        },
      });
  }

  carregarEnderecos(): void {
    this.carregandoEnderecos.set(true);
    this.erroEnderecos.set('');
    this.service
      .listarMeusEnderecos()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.carregandoEnderecos.set(false)),
      )
      .subscribe({
        next: (lista) => {
          this.enderecos.set(lista);
          const principal = lista.find((endereco) => endereco.principal);
          if (principal) {
            this.form.patchValue(
              {
                cep: principal.cep,
                logradouro: principal.logradouro,
                bairro: principal.bairro,
                numero: principal.numero,
                complemento: principal.complemento,
              },
              { emitEvent: false },
            );
            this.cepConfirmado.set(principal.cep);
            this.municipio.set(principal.municipio.nome);
            this.estado.set(principal.municipio.estado.sigla);
          }
        },
        error: () =>
          this.erroEnderecos.set('Não foi possível atualizar seus endereços. Tente novamente.'),
      });
  }

  iniciarNovoEndereco(): void {
    this.enderecoEditandoId.set(null);
    this.formEndereco.reset(
      {
        apelido: this.enderecos().length === 0 ? 'Principal' : 'Casa',
        destinatario: this.form.controls.nome.value || this.auth.nome(),
        cep: '',
        logradouro: '',
        bairro: '',
        numero: '',
        complemento: '',
        principal: this.enderecos().length === 0,
      },
      { emitEvent: false },
    );
    this.cepEnderecoConfirmado.set('');
    this.municipioEndereco.set('');
    this.estadoEndereco.set('');
    this.erroCepEndereco.set('');
    this.exibindoFormEndereco.set(true);
  }

  editarEndereco(endereco: Endereco): void {
    this.enderecoEditandoId.set(endereco.id);
    this.formEndereco.reset(
      {
        apelido: endereco.apelido,
        destinatario: endereco.destinatario,
        cep: endereco.cep,
        logradouro: endereco.logradouro,
        bairro: endereco.bairro,
        numero: endereco.numero,
        complemento: endereco.complemento,
        principal: endereco.principal,
      },
      { emitEvent: false },
    );
    this.cepEnderecoConfirmado.set(endereco.cep.replace('-', ''));
    this.municipioEndereco.set(endereco.municipio.nome);
    this.estadoEndereco.set(endereco.municipio.estado.sigla);
    this.erroCepEndereco.set('');
    this.exibindoFormEndereco.set(true);
  }

  cancelarEdicaoEndereco(): void {
    this.exibindoFormEndereco.set(false);
    this.enderecoEditandoId.set(null);
  }

  consultarCepEndereco(): void {
    if (this.salvandoEndereco()) return;
    const controle = this.formEndereco.controls.cep;
    controle.markAsTouched();
    if (controle.invalid) return;
    const cep = controle.value.replace('-', '');
    if (this.cepEnderecoConfirmado() === cep) return;
    this.consultaEndereco?.unsubscribe();
    this.cepEnderecoConfirmado.set('');
    this.erroCepEndereco.set('');
    this.consultandoCepEndereco.set(true);
    this.consultaEndereco = this.cepService
      .consultar(cep)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.consultandoCepEndereco.set(false)),
      )
      .subscribe({
        next: (dados) => {
          this.formEndereco.patchValue({ logradouro: dados.logradouro, bairro: dados.bairro });
          this.municipioEndereco.set(dados.localidade);
          this.estadoEndereco.set(dados.uf);
          this.cepEnderecoConfirmado.set(cep);
        },
        error: (erro: unknown) => this.erroCepEndereco.set(mensagemErro(erro)),
      });
  }

  salvarEndereco(): void {
    if (this.enderecosBloqueados() || this.consultandoCepEndereco()) return;
    const dados = this.formEndereco.getRawValue();
    this.formEndereco.patchValue(
      {
        apelido: dados.apelido.trim(),
        destinatario: dados.destinatario.trim(),
        logradouro: dados.logradouro.trim(),
        bairro: dados.bairro.trim(),
        numero: dados.numero.trim(),
        complemento: dados.complemento.trim(),
      },
      { emitEvent: false },
    );
    const cepLimpo = dados.cep.replace('-', '');
    if (this.formEndereco.invalid || this.cepEnderecoConfirmado() !== cepLimpo) {
      this.formEndereco.markAllAsTouched();
      if (!this.cepEnderecoConfirmado()) {
        this.erroCepEndereco.set('Consulte o CEP antes de salvar o endereço.');
      }
      return;
    }
    const payload = {
      ...this.formEndereco.getRawValue(),
      cep: cepLimpo,
    };
    const idEdicao = this.enderecoEditandoId();
    const requisicao =
      idEdicao != null
        ? this.service.atualizarMeuEndereco(idEdicao, payload)
        : this.service.criarMeuEndereco(payload);

    this.salvandoEndereco.set(true);
    requisicao
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.salvandoEndereco.set(false)),
      )
      .subscribe({
        next: () => {
          this.snack.open('Endereço salvo com sucesso.', 'Fechar', { duration: 3500 });
          this.exibindoFormEndereco.set(false);
          this.enderecoEditandoId.set(null);
          this.carregarEnderecos();
        },
        error: (erro: unknown) => this.snack.open(mensagemErro(erro), 'Fechar', { duration: 6000 }),
      });
  }

  definirPrincipal(endereco: Endereco): void {
    if (endereco.principal || this.enderecosBloqueados()) return;
    this.salvandoEndereco.set(true);
    this.service
      .definirMeuEnderecoPrincipal(endereco.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.salvandoEndereco.set(false)),
      )
      .subscribe({
        next: () => {
          this.snack.open(`${endereco.apelido} definido como endereço principal.`, 'Fechar', {
            duration: 3500,
          });
          this.carregarEnderecos();
        },
        error: (erro: unknown) => this.snack.open(mensagemErro(erro), 'Fechar', { duration: 6000 }),
      });
  }

  removerEndereco(endereco: Endereco): void {
    if (this.enderecosBloqueados()) return;
    this.salvandoEndereco.set(true);
    this.service
      .removerMeuEndereco(endereco.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.salvandoEndereco.set(false)),
      )
      .subscribe({
        next: () => {
          this.snack.open('Endereço removido.', 'Fechar', { duration: 3500 });
          this.carregarEnderecos();
        },
        error: (erro: unknown) => this.snack.open(mensagemErro(erro), 'Fechar', { duration: 6000 }),
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

  mensagemCampoEndereco(campo: keyof typeof this.formEndereco.controls): string {
    const controle = this.formEndereco.controls[campo];
    if (controle.hasError('required')) return 'Campo obrigatório.';
    if (controle.hasError('pattern')) return 'Informe um CEP com oito dígitos.';
    if (controle.hasError('minlength')) return 'Informe pelo menos dois caracteres.';
    if (controle.hasError('maxlength'))
      return `Use no máximo ${controle.errors?.['maxlength'].requiredLength} caracteres.`;
    return 'Revise este campo.';
  }

  dadosAlterados(): boolean {
    return this.form.controls.nome.value !== this.nomeOriginal();
  }

  cancelarAlteracoes(): void {
    if (
      !this.selfService ||
      this.paginaEnderecos() ||
      !this.dadosAlterados() ||
      this.enderecosBloqueados() ||
      this.consultando()
    )
      return;
    this.form.controls.nome.reset(this.nomeOriginal());
    this.avisoPerfil.set('');
  }

  salvar(): void {
    if (this.salvando() || this.consultando() || this.carregando() || this.erroPerfil()) return;
    if (this.selfService && this.enderecosBloqueados()) return;
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
      if (this.selfService) {
        const dadosInvalidos = this.form.controls.nome.invalid || this.form.controls.email.invalid;
        this.abrirPagina(!dadosInvalidos);
        this.avisoPerfil.set(
          dadosInvalidos
            ? 'Revise seus dados pessoais antes de salvar.'
            : 'Complete seu primeiro endereço para concluir o cadastro.',
        );
      }
      return;
    }
    this.avisoPerfil.set('');
    const cliente = { ...this.form.getRawValue(), cep: dados.cep.replace('-', '') };
    const { email: _email, ...perfil } = cliente;
    const requisicao = this.selfService
      ? this.service.saveMe(perfil)
      : this.cliente?.id != null
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
        next: (resposta) => {
          this.nomeOriginal.set(resposta.nome ?? perfil.nome);
          this.form.controls.nome.reset(this.nomeOriginal(), { emitEvent: false });
          this.snack.open(
            this.selfService ? 'Seus dados foram salvos.' : 'Cliente salvo com sucesso.',
            'Fechar',
            { duration: 4000 },
          );
          if (!this.selfService) {
            void this.router.navigate(['/admin/clientes']);
          } else if (this.returnUrl) {
            void this.router.navigateByUrl(this.returnUrl);
          } else {
            this.perfilSalvo.set(true);
            this.carregarEnderecos();
          }
        },
        error: (erro: unknown) => this.snack.open(mensagemErro(erro), 'Fechar', { duration: 7000 }),
      });
  }
}
