import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-home-explore',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  templateUrl: './home-explore.html',
  styleUrl: './home-explore.css',
})
export class HomeExploreComponent {
  readonly selections = [
    {
      id: 'catalogo',
      title: 'Descubra o novo.',
      label: 'Novidades',
      description: 'Seu próximo favorito pode estar aqui.',
      image: 'speed',
      icon: 'north_east',
    },
    {
      id: 'por-dpi',
      title: 'Ajuste sua mira.',
      label: 'Precisão',
      description: 'Compare sensores. Encontre seu controle.',
      image: 'precision',
      icon: 'center_focus_strong',
    },
    {
      id: 'menos-de-60g',
      title: 'Jogue mais leve.',
      label: 'Ultraleves',
      description: 'Explore a seleção abaixo de 60 g.',
      image: 'light',
      icon: 'air',
    },
  ];
}
