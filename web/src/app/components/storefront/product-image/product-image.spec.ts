import { TestBed } from '@angular/core/testing';
import { ProductImageComponent } from './product-image';

describe('Product images', () => {
  it('falls back after a broken image and recovers when the selected URL changes', () => {
    const fixture = TestBed.createComponent(ProductImageComponent);
    fixture.componentRef.setInput('nome', 'Mouse de teste');
    fixture.componentRef.setInput('imagem', {
      url: '/a.webp',
      textoAlternativo: 'Vista lateral',
      ordem: 0,
    });
    fixture.detectChanges();
    const image = fixture.nativeElement.querySelector('img') as HTMLImageElement;
    expect(image.alt).toBe('Vista lateral');
    image.dispatchEvent(new Event('error'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Imagem indisponível');
    fixture.componentRef.setInput('imagem', {
      url: '/b.webp',
      textoAlternativo: 'Vista superior',
      ordem: 1,
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img')?.alt).toBe('Vista superior');
  });
});
