import { Component, computed, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CatalogoFiltro } from '../../../models/catalogo.model';
import { MouseSceneComponent, MouseSceneKind } from './mouse-scene';

export interface HomeChapter {
  id: MouseSceneKind;
  theme: string;
  eyebrow: string;
  title: string;
  description: string;
  highlights: string[];
  cta: string;
  filters: CatalogoFiltro;
  nextFragment?: string;
  nextLabel?: string;
}

@Component({
  selector: 'app-home-chapter',
  standalone: true,
  imports: [RouterLink, MatIconModule, NgTemplateOutlet, MouseSceneComponent],
  templateUrl: './home-chapter.html',
  styleUrls: ['./home-chapter.css', './home-chapter-motion.css'],
})
export class HomeChapterComponent {
  readonly chapter = input.required<HomeChapter>();
  readonly opening = input(false);
  readonly words = computed(() => this.chapter().title.split(/\s+/));
}
