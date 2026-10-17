import { Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { from, concatMap, finalize } from 'rxjs';
import { ImagemUploadService } from '../../../services/imagem-upload.service';
import { mensagemErro } from '../../../services/erro-api';

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <input
      #arquivo
      type="file"
      hidden
      accept="image/png,image/jpeg,image/webp"
      [multiple]="limite() > 1"
      [disabled]="desabilitado() || enviando() || limite() < 1"
      (change)="selecionar(arquivo.files); arquivo.value = ''"
    />
    <button
      type="button"
      class="upload-box"
      [disabled]="desabilitado() || enviando() || limite() < 1"
      [attr.aria-busy]="enviando()"
      (click)="arquivo.click()"
      (dragover)="$event.preventDefault()"
      (drop)="soltar($event)"
    >
      <mat-icon aria-hidden="true">{{ enviando() ? 'hourglass_empty' : 'cloud_upload' }}</mat-icon>
      <strong>{{ enviando() ? 'Enviando imagem…' : rotulo() }}</strong>
      <span>Arraste ou selecione · PNG, JPEG ou WebP · Até 5 MB por arquivo</span>
    </button>
    @if (enviando()) {
      <p role="status">Aguarde o envio antes de salvar.</p>
    }
    @if (erro()) {
      <p role="alert">{{ erro() }}</p>
    }
  `,
  styles: `
    :host {
      display: block;
      margin-block: 16px;
      min-width: 0;
    }
    .upload-box {
      display: grid;
      justify-items: center;
      gap: 12px;
      width: 100%;
      min-height: 180px;
      padding: 24px;
      border: 1px dashed var(--slate-blue);
      border-radius: 16px;
      background: var(--alice-blue);
      color: var(--prussian-blue);
      font: inherit;
      text-align: center;
      cursor: pointer;
    }
    .upload-box:disabled {
      opacity: 0.65;
      cursor: default;
    }
    .upload-box:focus-visible {
      outline: 3px solid var(--slate-blue);
      outline-offset: 3px;
    }
    mat-icon {
      width: 40px;
      height: 40px;
      font-size: 40px;
      color: var(--slate-blue);
    }
    span,
    p {
      font-size: 13px;
      line-height: 1.6;
      color: var(--neutral-700);
    }
  `,
})
export class ImageUploadComponent {
  private readonly service = inject(ImagemUploadService);
  private readonly destroyRef = inject(DestroyRef);
  readonly destino = input.required<'mouses' | 'marcas'>();
  readonly limite = input(1);
  readonly rotulo = input('Enviar imagem');
  readonly desabilitado = input(false);
  readonly enviada = output<string>();
  readonly ocupado = output<boolean>();
  readonly enviando = signal(false);
  readonly erro = signal('');

  soltar(evento: DragEvent): void {
    evento.preventDefault();
    this.selecionar(evento.dataTransfer?.files ?? null);
  }

  selecionar(lista: FileList | null): void {
    if (!lista?.length || this.desabilitado() || this.enviando() || this.limite() < 1) return;
    this.erro.set('');
    const arquivos = Array.from(lista);
    if (arquivos.length > this.limite()) {
      this.erro.set(`Selecione no máximo ${this.limite()} imagem(ns).`);
      return;
    }
    if (
      arquivos.some(
        (a) =>
          !['image/png', 'image/jpeg', 'image/webp'].includes(a.type) ||
          a.size === 0 ||
          a.size > 5 * 1024 * 1024,
      )
    ) {
      this.erro.set('Use imagens PNG, JPEG ou WebP de até 5 MB, não vazias.');
      return;
    }
    this.enviando.set(true);
    this.ocupado.emit(true);
    from(arquivos)
      .pipe(
        concatMap((arquivo) => this.service.enviar(this.destino(), arquivo)),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.enviando.set(false);
          this.ocupado.emit(false);
        }),
      )
      .subscribe({
        next: (resposta) => this.enviada.emit(resposta.url),
        error: (erro: unknown) =>
          this.erro.set(
            mensagemErro(erro) +
              ' As imagens já enviadas foram mantidas; selecione novamente apenas as restantes.',
          ),
      });
  }
}
