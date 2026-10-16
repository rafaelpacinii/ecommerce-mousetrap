import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { Marca } from '../../../models/marca.model';
import { Mouse, MouseDTO, TIPOS_CONEXAO } from '../../../models/mouse.model';
import { MarcaService } from '../../../services/marca.service';
import { MouseService } from '../../../services/mouse.service';
import { mensagemErro, textoObrigatorio } from '../../../services/erro-api';

@Component({
  selector: 'app-mouse-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './mouse-form.html',
  styleUrl: './mouse-form.css',
})
export class MouseFormComponent implements OnInit {
  private readonly service = inject(MouseService);
  private readonly marcaService = inject(MarcaService);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  readonly mouse: Mouse | undefined = inject(ActivatedRoute).snapshot.data['mouse'];
  readonly marcas = signal<Marca[]>([]);
  readonly carregandoMarcas = signal(true);
  readonly erroMarcas = signal('');
  readonly salvando = signal(false);
  readonly tiposConexao = TIPOS_CONEXAO;
  readonly form = this.fb.nonNullable.group({
    sku: [
      '',
      [
        Validators.required,
        Validators.maxLength(50),
        Validators.pattern(/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/),
      ],
    ],
    nome: [
      '',
      [Validators.required, textoObrigatorio, Validators.minLength(2), Validators.maxLength(150)],
    ],
    descricao: ['', [Validators.required, textoObrigatorio, Validators.maxLength(5000)]],
    cor: ['', [Validators.required, textoObrigatorio, Validators.maxLength(50)]],
    preco: [
      0,
      [
        Validators.required,
        Validators.min(0.01),
        Validators.max(9999999999.99),
        Validators.pattern(/^\d+(\.\d{1,2})?$/),
      ],
    ],
    quantidadeEstoque: [
      0,
      [
        Validators.required,
        Validators.min(0),
        Validators.max(2147483647),
        Validators.pattern(/^\d+$/),
      ],
    ],
    dpiMaximo: [
      0,
      [
        Validators.required,
        Validators.min(1),
        Validators.max(2147483647),
        Validators.pattern(/^\d+$/),
      ],
    ],
    quantidadeBotoes: [
      0,
      [
        Validators.required,
        Validators.min(1),
        Validators.max(2147483647),
        Validators.pattern(/^\d+$/),
      ],
    ],
    pesoGramas: [
      0,
      [
        Validators.required,
        Validators.min(0.01),
        Validators.max(999999.99),
        Validators.pattern(/^\d+(\.\d{1,2})?$/),
      ],
    ],
    ativo: [true, Validators.required],
    idMarca: this.fb.control<number | null>(null, Validators.required),
    tiposConexao: this.fb.nonNullable.control<number[]>([], Validators.required),
  });

  constructor() {
    if (this.mouse) {
      this.form.patchValue({
        ...this.mouse,
        idMarca: this.mouse.marca.id,
        tiposConexao: this.mouse.tiposConexao.map((tipo) => tipo.id),
      });
    }
  }

  ngOnInit(): void {
    this.carregarMarcas();
  }

  carregarMarcas(): void {
    this.carregandoMarcas.set(true);
    this.form.disable({ emitEvent: false });
    this.erroMarcas.set('');
    this.marcaService
      .findAll()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.form.enable({ emitEvent: false });
          this.carregandoMarcas.set(false);
        }),
      )
      .subscribe({
        next: (response) => this.marcas.set(response.items),
        error: (erro: unknown) => this.erroMarcas.set(mensagemErro(erro)),
      });
  }

  salvar(): void {
    if (this.salvando() || this.carregandoMarcas() || this.erroMarcas() || !this.marcas().length)
      return;
    for (const campo of ['sku', 'nome', 'descricao', 'cor'] as const) {
      this.form.controls[campo].setValue(this.form.controls[campo].value.trim());
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const valores = this.form.getRawValue();
    if (valores.idMarca == null) return;
    const dados: MouseDTO = {
      ...valores,
      sku: valores.sku.toUpperCase(),
      idMarca: valores.idMarca,
      versao: this.mouse?.versao,
    };
    const requisicao =
      this.mouse?.id != null
        ? this.service.update(this.mouse.id, dados)
        : this.service.create(dados);
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
          this.snack.open('Mouse salvo com sucesso.', 'Fechar', { duration: 4000 });
          void this.router.navigate(['/mouses']);
        },
        error: (erro: unknown) => this.snack.open(mensagemErro(erro), 'Fechar', { duration: 7000 }),
      });
  }
}
