import { Component, inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { HomeChapterComponent, HomeChapter } from './home-chapter';
import { HomeShelfComponent, HomeShelf } from './home-shelf';
import { HomeExploreComponent } from './home-explore';
import { HomeBrandsComponent } from './home-brands';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    MatIconModule,
    RouterLink,
    HomeChapterComponent,
    HomeShelfComponent,
    HomeExploreComponent,
    HomeBrandsComponent,
  ],
  templateUrl: './home.html',
  styleUrls: ['./home.css', './home-progress.css'],
})
export class HomeComponent {
  readonly chapters: HomeChapter[] = [
    {
      id: 'velocidade',
      theme: 'Velocidade',
      eyebrow: 'CADA MILISSEGUNDO CONTA',
      title: 'Seu próximo movimento começa aqui.',
      description:
        'Encontre o mouse que acompanha seu ritmo. Explore conexões, sensores e formatos para o seu jeito de jogar.',
      highlights: ['4000–8000 Hz Polling', 'Switches Ópticos', 'Resposta Imediata'],
      cta: 'Explorar velocidade',
      filters: { pollingRateMin: 4000, tipoSwitch: 1 },
    },
    {
      id: 'precisao',
      theme: 'Precisão',
      eyebrow: 'ENCONTRE O SEU ALVO',
      title: 'Cada detalhe faz parte da sua mira.',
      description:
        'Conheça os sensores e compare a resolução de cada modelo. O próximo ajuste é seu.',
      highlights: ['Rastreio 1:1', 'Sensores de Alta Resolução', 'Controle de Microajuste'],
      cta: 'Explorar precisão',
      filters: { ordenar: 'maior-dpi' },
      nextFragment: 'por-dpi',
      nextLabel: 'Comparar sensores',
    },
    {
      id: 'ultraleves',
      theme: 'Ultraleves',
      eyebrow: 'MAIS LIBERDADE PARA MOVER',
      title: 'Menos peso. Mais possibilidades.',
      description:
        'Descubra mouses abaixo de 60 g e compare os formatos para encontrar o equilíbrio na sua mão.',
      highlights: ['Abaixo de 60 g', 'Baixa Inércia', 'Equilíbrio Central'],
      cta: 'Conhecer ultraleves',
      filters: { pesoMax: 59.99, ordenar: 'menor-peso' },
      nextFragment: 'menos-de-60g',
      nextLabel: 'Ver seleção leve',
    },
    {
      id: 'deslizamento',
      theme: 'Deslizamento',
      eyebrow: 'ENCONTRE SEU PRÓXIMO MOUSE',
      title: 'O próximo movimento é seu.',
      description:
        'Do primeiro clique ao último round. Explore o catálogo e escolha o que combina com você.',
      highlights: ['Pés em PTFE Puro', 'Formatos Simétricos e Ergonômicos', 'Catálogo Completo'],
      cta: 'Explorar catálogo',
      filters: {},
    },
  ];
  readonly shelves: HomeShelf[] = [
    {
      id: 'catalogo',
      eyebrow: 'DESCUBRA O QUE CHEGOU',
      title: 'Novidades do catálogo',
      description: 'Os cadastros mais recentes, prontos para você conhecer.',
      filters: { ordenar: 'recentes' },
      searchable: true,
    },
    {
      id: 'por-dpi',
      eyebrow: 'OLHE MAIS DE PERTO',
      title: 'Explore por DPI',
      description: 'Compare os modelos, começando pelas maiores resoluções de sensor.',
      filters: { ordenar: 'maior-dpi' },
    },
    {
      id: 'menos-de-60g',
      eyebrow: 'LEVEZA EM CADA ESCOLHA',
      title: 'Menos de 60 g',
      description: 'Uma seleção por peso. O formato ideal você escolhe.',
      filters: { pesoMax: 59.99, ordenar: 'menor-peso' },
    },
  ];
  readonly grips = [
    {
      id: 2,
      name: 'Claw',
      icon: 'touch_app',
      image: 'u2-left.avif',
      width: 2000,
      summary: 'Agilidade na ponta dos dedos.',
      description:
        'Dedos arqueados e a base da palma apoiada. Observe o formato da traseira e o espaço para movimentar os dedos.',
    },
    {
      id: 1,
      name: 'Palm',
      icon: 'pan_tool',
      image: 'superlight-side.webp',
      width: 2400,
      summary: 'Apoio para a mão inteira.',
      description:
        'A palma acompanha o corpo do mouse. Compare o comprimento e a curvatura do modelo com o tamanho da sua mão.',
    },
    {
      id: 3,
      name: 'Fingertip',
      icon: 'gesture',
      image: 'sabre-angle.avif',
      width: 2400,
      summary: 'Liberdade para cada movimento.',
      description:
        'Somente as pontas dos dedos tocam o mouse. Peso e dimensões ajudam a escolher um modelo confortável para esse apoio.',
    },
  ];

  constructor() {
    inject(Meta).updateTag({
      name: 'description',
      content:
        'Encontre seu próximo mouse gamer na MouseTrap. Explore novidades do catálogo, sensores, mouses ultraleves e a pegada que combina com você.',
    });
  }
}
