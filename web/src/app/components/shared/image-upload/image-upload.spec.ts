import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ImageUploadComponent } from './image-upload';

describe('ImageUploadComponent', () => {
  let http: HttpTestingController;
  const file = () => new File(['image'], 'mouse.png', { type: 'image/png' });
  const files = (...items: File[]) => items as unknown as FileList;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('uploads sequentially with multipart and preserves completed uploads when another fails', () => {
    const fixture = TestBed.createComponent(ImageUploadComponent);
    fixture.componentRef.setInput('destino', 'mouses');
    fixture.componentRef.setInput('limite', 3);
    const c = fixture.componentInstance;
    const uploaded: string[] = [];
    const busy: boolean[] = [];
    c.enviada.subscribe((url) => uploaded.push(url));
    c.ocupado.subscribe((value) => busy.push(value));
    c.selecionar(files(file(), file(), file()));
    const first = http.expectOne('http://localhost:8080/imagens/mouses');
    expect(first.request.method).toBe('POST');
    expect(first.request.body instanceof FormData).toBe(true);
    expect(first.request.body.get('arquivo').name).toBe('mouse.png');
    expect(first.request.headers.has('Content-Type')).toBe(false);
    c.selecionar(files(file()));
    http.expectNone('http://localhost:8080/imagens/mouses');
    first.flush({ url: 'https://images.example.com/mouses/1.png' });
    http
      .expectOne('http://localhost:8080/imagens/mouses')
      .flush({ detail: 'Armazenamento indisponível.' }, { status: 503, statusText: 'Unavailable' });
    expect(uploaded).toEqual(['https://images.example.com/mouses/1.png']);
    expect(busy).toEqual([true, false]);
    expect(c.erro()).toContain('Armazenamento indisponível');
    expect(c.enviando()).toBe(false);
    http.expectNone('http://localhost:8080/imagens/mouses');
  });

  it('rejects unsupported files, empty files, oversize batches and extra brand logos before upload', () => {
    const fixture = TestBed.createComponent(ImageUploadComponent);
    fixture.componentRef.setInput('destino', 'marcas');
    const c = fixture.componentInstance;
    for (const selection of [
      files(file(), file()),
      files(new File(['svg'], 'logo.svg', { type: 'image/svg+xml' })),
      files(new File([], 'logo.png', { type: 'image/png' })),
      files(new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'logo.png', { type: 'image/png' })),
    ]) {
      c.selecionar(selection);
      expect(c.erro()).not.toBe('');
    }
    http.expectNone('http://localhost:8080/imagens/marcas');
    fixture.componentRef.setInput('desabilitado', true);
    c.selecionar(files(file()));
    http.expectNone('http://localhost:8080/imagens/marcas');
    fixture.componentRef.setInput('desabilitado', false);
    c.selecionar(files(file()));
    http
      .expectOne('http://localhost:8080/imagens/marcas')
      .flush({ url: 'https://images.example.com/logo.png' });
    expect(c.erro()).toBe('');
  });
});
