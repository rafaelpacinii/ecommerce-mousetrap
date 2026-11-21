import { TestBed } from '@angular/core/testing';
import { MouseSceneComponent } from './mouse-scene';

describe('static mouse illustration', () => {
  it('serves the opening image immediately and loads the later chapter image lazily', () => {
    const fixture = TestBed.createComponent(MouseSceneComponent);
    fixture.componentRef.setInput('kind', 'velocidade');
    fixture.componentRef.setInput('priority', true);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const image = () => element.querySelector('img')!;
    expect(image().getAttribute('src')).toMatch(/g-pro-superlight-speed\.webp$/);
    expect(image().getAttribute('loading')).toBe('eager');
    expect(image().getAttribute('fetchpriority')).toBe('high');

    fixture.componentRef.setInput('kind', 'precisao');
    fixture.componentRef.setInput('priority', false);
    fixture.detectChanges();
    expect(image().getAttribute('src')).toMatch(/g-pro-superlight-precision\.webp$/);
    expect(image().getAttribute('loading')).toBe('lazy');
    expect(element.querySelector('canvas, button')).toBeNull();
  });
});
