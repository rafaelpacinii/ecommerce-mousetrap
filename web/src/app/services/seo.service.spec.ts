import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, TitleStrategy } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { SeoService } from './seo.service';

@Component({ standalone: true, template: '<h1>Page</h1>' })
class Page {}

describe('Route metadata', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: 'catalogo',
            component: Page,
            title: 'Catálogo | MouseTrap',
            data: { description: 'Compare mouses.' },
          },
          {
            path: 'minha-conta',
            component: Page,
            title: 'Minha conta | MouseTrap',
            data: { description: 'Gerencie seus dados.' },
          },
        ]),
        { provide: TitleStrategy, useExisting: SeoService },
      ],
    }),
  );

  it('uses one canonical without filters, updates social tags and protects private routes', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/catalogo?marca=2');
    expect(document.title).toBe('Catálogo | MouseTrap');
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(
      'Compare mouses.',
    );
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toMatch(
      /\/catalogo$/,
    );
    expect(
      document.querySelector('meta[property="og:url"]')?.getAttribute('content'),
    ).not.toContain('?');
    await harness.navigateByUrl('/minha-conta?email=private@example.test');
    expect(document.querySelector('link[rel="canonical"]')).toBeNull();
    expect(document.querySelector('meta[property="og:url"]')).toBeNull();
    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe(
      'noindex, nofollow',
    );
    expect(document.querySelector('meta[property="og:description"]')?.getAttribute('content')).toBe(
      'Gerencie seus dados.',
    );
    expect(document.head.innerHTML).not.toContain('private@example.test');
    await harness.navigateByUrl('/catalogo');
    expect(document.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe(
      'index, follow',
    );
  });
});
