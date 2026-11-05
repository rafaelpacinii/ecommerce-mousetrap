import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { CatalogoFiltro } from '../../../models/catalogo.model';

interface Banner {
  id: number;
  tema: string;
  icone: string;
  tagline: string;
  titulo: string;
  descricao: string;
  cta: string;
  imagem: string;
  filtros: CatalogoFiltro;
}

@Component({
  selector: 'app-hero-carousel',
  standalone: true,
  imports: [MatIconModule, RouterLink],
  templateUrl: './hero-carousel.html',
  styleUrl: './hero-carousel.css',
})
export class HeroCarouselComponent {
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private rotationBeforePointer?: boolean;
  private readonly hovered = signal(false);
  private readonly reproduzirDuranteHover = signal(false);
  private readonly pageHidden = signal(this.document.hidden);
  readonly rotacaoSolicitada = signal(true);
  readonly indice = signal(0);
  readonly visitados = signal(new Set([0]));
  readonly anuncio = signal('');
  readonly girando = computed(
    () =>
      this.rotacaoSolicitada() &&
      (!this.hovered() || this.reproduzirDuranteHover()) &&
      !this.pageHidden(),
  );
  readonly banners: readonly Banner[] = [
    {
      id: 1,
      tema: 'Velocidade',
      icone: 'flash_on',
      tagline: 'RESPOSTA INSTANTÂNEA. ZERO DELAY.',
      titulo: 'A velocidade que define cada round.',
      descricao:
        'Polling rate de alta frequência e switches ópticos para registrar seu reflexo no exato milissegundo.',
      cta: 'Ver mouses ultrarrápidos',
      imagem: 'hero',
      filtros: { pollingRateMin: 4000, tipoSwitch: 1 },
    },
    {
      id: 2,
      tema: 'Precisão',
      icone: 'my_location',
      tagline: 'RASTREIO IMPECÁVEL. MIRA REAL.',
      titulo: 'Precisão cirúrgica pixel por pixel.',
      descricao:
        'Sensores topo de linha com rastreio 1:1 puro, sem aceleração artificial, para colocar a mira onde você quer.',
      cta: 'Escolher precisão',
      imagem: 'hero-2',
      filtros: { ordenar: 'maior-dpi' },
    },
    {
      id: 3,
      tema: 'Ultraleves',
      icone: 'air',
      tagline: 'LEVEZA EXTREMA. ZERO INÉRCIA.',
      titulo: 'Menos peso, controle total.',
      descricao:
        'Estruturas abaixo de 60g com centro de gravidade perfeito para paradas bruscas e movimentos sem fadiga.',
      cta: 'Conhecer ultraleves',
      imagem: 'hero-3',
      filtros: { pesoMax: 59.99, ordenar: 'menor-peso' },
    },
    {
      id: 4,
      tema: 'Deslizamento',
      icone: 'ac_unit',
      tagline: 'ATRITO ZERO. FLUIDEZ PURA.',
      titulo: 'Deslize suave como no gelo.',
      descricao:
        'Skates em 100% PTFE virgem com bordas arredondadas para micro-ajustes rápidos e transições perfeitas.',
      cta: 'Sentir o deslize',
      imagem: 'hero-4',
      filtros: {},
    },
  ];

  constructor() {
    const visibilityChanged = () => this.pageHidden.set(this.document.hidden);
    this.document.addEventListener('visibilitychange', visibilityChanged);
    this.destroyRef.onDestroy(() => {
      this.document.removeEventListener('visibilitychange', visibilityChanged);
    });
    effect((cleanup) => {
      if (!this.girando()) return;
      const timer = setInterval(() => {
        if (this.girando()) this.exibir(this.indice() + 1);
      }, 7000);
      cleanup(() => clearInterval(timer));
    });
  }

  hover(value: boolean): void {
    this.hovered.set(value);
    if (!value) this.reproduzirDuranteHover.set(false);
  }

  pausar(): void {
    this.rotacaoSolicitada.set(false);
    this.reproduzirDuranteHover.set(false);
  }

  lembrarRotacao(): void {
    // Pointer focus pauses rotation before click; retain the originally intended action.
    this.rotationBeforePointer = this.girando();
  }

  esquecerRotacao(): void {
    this.rotationBeforePointer = undefined;
  }

  alternarRotacao(): void {
    const reproduzir = !(this.rotationBeforePointer ?? this.girando());
    this.rotacaoSolicitada.set(reproduzir);
    this.reproduzirDuranteHover.set(reproduzir && this.hovered());
    this.rotationBeforePointer = undefined;
  }

  selecionar(index: number): void {
    if (index === this.indice()) return;
    this.pausar();
    this.exibir(index);
    this.anuncio.set(
      `${this.indice() + 1} de ${this.banners.length}: ${this.banners[this.indice()].titulo}`,
    );
  }

  private exibir(index: number): void {
    const next = (index + this.banners.length) % this.banners.length;
    this.visitados.update((visited) => new Set([...visited, next]));
    this.indice.set(next);
  }
}
