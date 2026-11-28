import { Component, computed, input } from '@angular/core';

export type MouseSceneKind = 'velocidade' | 'precisao' | 'ultraleves' | 'deslizamento';

interface SceneAssets {
  file: string;
  width: number;
  telemetryPrimary: { value: string; caption: string };
  telemetrySecondary: { value: string; caption: string };
}

const assets: Record<MouseSceneKind, SceneAssets> = {
  velocidade: {
    file: 'g-pro-superlight-speed.webp',
    width: 1024,
    telemetryPrimary: { value: '0.125 ms', caption: 'TEMPO DE RESPOSTA · 8000 HZ' },
    telemetrySecondary: { value: 'ÓPTICO', caption: 'ATUADORES SEM DEBOUNCE' },
  },
  precisao: {
    file: 'g-pro-superlight-precision.webp',
    width: 1024,
    telemetryPrimary: { value: '1 : 1', caption: 'LEITURA DE EIXO SEM ACELERAÇÃO' },
    telemetrySecondary: { value: 'ALTA DPI', caption: 'SENSORES ÓPTICOS DE PRECISÃO' },
  },
  ultraleves: {
    file: 'g-pro-superlight-light.webp',
    width: 1024,
    telemetryPrimary: { value: '< 60 g', caption: 'ENGENHARIA ULTRALEVE' },
    telemetrySecondary: { value: 'EQUILÍBRIO', caption: 'CENTRO DE MASSA ESTABILIZADO' },
  },
  deslizamento: {
    file: 'g-pro-superlight-glide.webp',
    width: 1024,
    telemetryPrimary: { value: 'PTFE', caption: 'DESLIZAMENTO DE BAIXO ATRITO' },
    telemetrySecondary: { value: '360°', caption: 'TRANSIÇÃO LIVRE EM QUALQUER EIXO' },
  },
};

@Component({
  selector: 'app-mouse-scene',
  standalone: true,
  templateUrl: './mouse-scene.html',
  styleUrls: ['./mouse-scene.css', './mouse-scene-geometry.css'],
  host: { '[attr.data-kind]': 'kind()', 'aria-hidden': 'true' },
})
export class MouseSceneComponent {
  readonly kind = input.required<MouseSceneKind>();
  readonly priority = input(false);
  readonly asset = computed(() => assets[this.kind()]);
}
