import { MatIconModule } from '@angular/material/icon';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EMPTY, expand, finalize, reduce } from 'rxjs';
import { ProductImageComponent } from '../../storefront/product-image/product-image';
import { PEGADAS, POLLING_RATES, TIPOS_SWITCH } from '../../../models/catalogo.model';
import { ImagemMouse } from '../../../models/mouse.model';
import { Marca } from '../../../models/marca.model';
import { Mouse, MouseDTO, TIPOS_CONEXAO } from '../../../models/mouse.model';
import { MarcaService } from '../../../services/marca.service';
import { MouseService } from '../../../services/mouse.service';
import { mensagemErro, textoObrigatorio } from '../../../services/erro-api';

type ImagemForm = FormGroup<{
  url: FormControl<string>;
  textoAlternativo: FormControl<string>;
  ordem: FormControl<number>;
}>;

@Component({
  selector: 'app-mouse-form',
  standalone: true,
  imports: [
    MatIconModule,
    ProductImageComponent,
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
  readonly pegadas = PEGADAS;
  readonly pollingRates = POLLING_RATES;
  readonly tiposSwitch = TIPOS_SWITCH;
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
    especificacoes: this.fb.nonNullable.group({
      sensor: ['', Validators.maxLength(100)],
      pollingRate: this.fb.control<number | null>(null),
      tipoSwitch: this.fb.control<number | null>(null),
      modeloSwitch: ['', Validators.maxLength(100)],
      pegadas: this.fb.nonNullable.control<number[]>([]),
    }),
    imagens: this.fb.array<ImagemForm>([]),
    ativo: [true, Validators.required],
    idMarca: this.fb.control<number | null>(null, Validators.required),
    tiposConexao: this.fb.nonNullable.control<number[]>([], Validators.required),
  });

  constructor() {
    if (this.mouse) {
      this.form.patchValue({
        ...this.mouse,
        especificacoes: {
          sensor: this.mouse.especificacoes?.sensor ?? '',
          pollingRate: this.mouse.especificacoes?.pollingRate ?? null,
          tipoSwitch: this.mouse.especificacoes?.tipoSwitch?.id ?? null,
          modeloSwitch: this.mouse.especificacoes?.modeloSwitch ?? '',
          pegadas: this.mouse.especificacoes?.pegadas.map((p) => p.id) ?? [],
        },
        idMarca: this.mouse.marca.id,
        tiposConexao: this.mouse.tiposConexao.map((tipo) => tipo.id),
      });
      [...(this.mouse.imagens ?? [])]
        .sort((a, b) => a.ordem - b.ordem)
        .forEach((imagem) => this.adicionarImagem(imagem));
    }
  }

  get imagens() {
    return this.form.controls.imagens;
  }
  adicionarImagem(imagem?: ImagemMouse): void {
    if (this.imagens.length >= 12) return;
    this.imagens.push(
      this.fb.nonNullable.group({
        url: [
          imagem?.url ?? '',
          [
            Validators.required,
            Validators.maxLength(2048),
            Validators.pattern(/^(https?:\/\/[^\s]+|\/(?!\/)[^\s]*)$/),
          ],
        ],
        textoAlternativo: [
          imagem?.textoAlternativo ?? '',
          [Validators.required, textoObrigatorio, Validators.maxLength(200)],
        ],
        ordem: [this.imagens.length],
      }),
    );
  }
  removerImagem(indice: number): void {
    this.imagens.removeAt(indice);
    this.reordenar();
  }
  moverImagem(indice: number, direcao: number): void {
    const destino = indice + direcao;
    if (destino < 0 || destino >= this.imagens.length) return;
    const imagem = this.imagens.at(indice);
    this.imagens.removeAt(indice);
    this.imagens.insert(destino, imagem);
    this.reordenar();
  }
  private reordenar(): void {
    this.imagens.controls.forEach((imagem, ordem) => imagem.controls.ordem.setValue(ordem));
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
        expand((response) =>
          response.page + 1 < response.totalPages
            ? this.marcaService.findAll(response.page + 1, response.pageSize)
            : EMPTY,
        ),
        reduce((marcas, response) => [...marcas, ...response.items], [] as Marca[]),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.form.enable({ emitEvent: false });
          this.carregandoMarcas.set(false);
        }),
      )
      .subscribe({
        next: (marcas) => this.marcas.set(marcas),
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
          void this.router.navigate(['/admin/mouses']);
        },
        error: (erro: unknown) => this.snack.open(mensagemErro(erro), 'Fechar', { duration: 7000 }),
      });
  }
}
