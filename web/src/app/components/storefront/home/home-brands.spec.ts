import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { HomeBrandsComponent } from './home-brands';

describe('public home brands', () => {
  const url = 'http://localhost:8080/catalogo/filtros';
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HomeBrandsComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  function create() {
    const fixture = TestBed.createComponent(HomeBrandsComponent);
    fixture.detectChanges();
    return fixture;
  }
  it('shows only valid logos and keeps brand names accessible through the links', () => {
    const fixture = create();
    expect(fixture.nativeElement.textContent).toContain('Carregando marcas');
    http.expectOne(url).flush({
      marcas: [
        { id: 21, nome: 'Marca A', ativo: true, logomarcaUrl: 'https://example.invalid/logo.webp' },
        {
          id: 22,
          nome: 'Marca B',
          ativo: true,
          logomarcaUrl: 'https://example.invalid/other.webp',
        },
        { id: 23, nome: 'Sem logo', ativo: true },
      ],
    });
    fixture.detectChanges();
    const links = fixture.nativeElement.querySelectorAll(
      '.brand-list:not(.brand-copy) .brand-link',
    ) as NodeListOf<HTMLAnchorElement>;
    expect([...links].map((link) => link.getAttribute('href'))).toEqual([
      '/catalogo?marca=21',
      '/catalogo?marca=22',
    ]);
    expect(links[1].getAttribute('aria-label')).toBe('Ver mouses da Marca B');
    expect(
      [...links].every((link) => link.textContent?.trim() === '' && link.querySelector('img')),
    ).toBe(true);
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
    links[0].querySelector('img')!.dispatchEvent(new Event('error'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('a[aria-label="Ver mouses da Marca A"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('.brands-content').getAttribute('aria-busy')).toBe(
      'false',
    );
    const copies = fixture.nativeElement.querySelectorAll(
      '.brand-copy a',
    ) as NodeListOf<HTMLAnchorElement>;
    expect(copies.length).toBeGreaterThan(0);
    expect(
      [...copies].every((link) => link.tabIndex === -1 && link.closest('[aria-hidden="true"]')),
    ).toBe(true);
  });
  it('retries an isolated failure and renders an honest empty state without invented brands', () => {
    const fixture = create();
    http
      .expectOne(url)
      .flush({ detail: 'Private error' }, { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Private error');
    fixture.nativeElement.querySelector('button').click();
    http.expectOne(url).flush({ marcas: [] });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Nenhuma logomarca disponível');
    expect(fixture.nativeElement.querySelectorAll('.brand-link')).toHaveLength(0);
  });
  it('cancels a pending request on navigation', () => {
    const fixture = create();
    const request = http.expectOne(url);
    fixture.destroy();
    expect(request.cancelled).toBe(true);
  });
});
