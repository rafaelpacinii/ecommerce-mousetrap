import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';
import { AuthService } from './services/auth.service';
import { routes } from './app.routes';
import { ClienteFormComponent } from './components/clientes/cliente-form/cliente-form';

const municipio = {
  id: 1,
  nome: 'São Paulo',
  codigoIbge: '3550308',
  estado: { id: 1, nome: 'São Paulo', sigla: 'SP' },
};
const perfil = {
  id: 4,
  nome: 'Cliente',
  email: 'cliente@example.com',
  cep: '01001000',
  logradouro: 'Praça da Sé',
  bairro: 'Sé',
  numero: '10',
  complemento: '',
  municipio,
};
const endereco = { ...perfil, id: 11, apelido: 'Casa', destinatario: 'Cliente', principal: true };

describe('App routing', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it.each(['/meus-pedidos', '/lista-de-desejos', '/meus-dados', '/enderecos'])(
    'protects the shared portal before rendering customer data: %s',
    async (url) => {
      const fixture = TestBed.createComponent(App);
      await TestBed.inject(Router).navigateByUrl(url);
      fixture.detectChanges();
      expect(TestBed.inject(Router).url).toBe('/login?returnUrl=' + encodeURIComponent(url));
      expect(fixture.nativeElement.querySelector('app-customer-portal-layout')).toBeNull();
      http.expectNone(() => true);
    },
  );

  it('keeps the account navigation mounted across orders, personal data, addresses and wishlist', async () => {
    const auth = TestBed.inject(AuthService);
    auth.authenticated.set(true);
    auth.nome.set('Cliente');
    auth.email.set(perfil.email);
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(App);
    await router.navigateByUrl('/meus-pedidos');
    fixture.detectChanges();
    http.expectOne((r) => r.url.endsWith('/pedidos/me')).flush({ items: [], totalItems: 0 });
    const root = fixture.nativeElement as HTMLElement;
    const navigation = root.querySelector('app-account-nav')!;
    (navigation.querySelector('a[href="/meus-dados"]') as HTMLAnchorElement).click();
    await fixture.whenStable();
    http.expectOne('http://localhost:8080/clientes/me').flush(perfil);
    http.expectOne('http://localhost:8080/clientes/me/enderecos').flush([endereco]);
    fixture.detectChanges();
    await fixture.whenStable();
    const component = fixture.debugElement.query(By.directive(ClienteFormComponent))
      .componentInstance as ClienteFormComponent;
    expect(root.querySelector('app-account-nav')).toBe(navigation);
    expect(navigation.querySelector('a[aria-current="page"]')?.textContent).toContain('Meus dados');
    const name = root.querySelector(
      '.account-form input[formControlName="nome"]',
    ) as HTMLInputElement;
    const cancel = root.querySelector('.profile-cancel') as HTMLButtonElement;
    expect(cancel.disabled).toBe(true);
    name.value = 'Nome atualizado';
    name.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(cancel.disabled).toBe(false);
    component.formEndereco.controls.apelido.setValue('Trabalho');
    cancel.click();
    fixture.detectChanges();
    expect(cancel.disabled).toBe(true);
    expect(name.value).toBe(perfil.nome);
    expect(component.formEndereco.controls.apelido.value).toBe('Trabalho');
    expect(router.url).toBe('/meus-dados');
    name.value = 'Nome atualizado';
    name.dispatchEvent(new Event('input', { bubbles: true }));
    expect(root.querySelector('.account-form input[formControlName="cep"]')).toBeNull();

    (navigation.querySelector('a[href="/enderecos"]') as HTMLAnchorElement).click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(router.url).toBe('/enderecos');
    expect(root.querySelector('app-account-nav')).toBe(navigation);
    expect(navigation.querySelector('a[aria-current="page"]')?.textContent).toContain('Endereços');
    expect(root.querySelector('.account-form input[formControlName="nome"]')).toBeNull();
    expect(root.querySelector('.account-form')?.textContent).toContain('Meus endereços de entrega');

    const novoPrincipal = { ...endereco, id: 12, apelido: 'Trabalho', numero: '200' };
    component.definirPrincipal({ ...novoPrincipal, principal: false });
    component.salvar();
    http.expectNone('http://localhost:8080/clientes/me');
    http.expectOne('http://localhost:8080/clientes/me/enderecos/12/principal').flush(novoPrincipal);
    component.salvar();
    http.expectNone('http://localhost:8080/clientes/me');
    http
      .expectOne('http://localhost:8080/clientes/me/enderecos')
      .flush({}, { status: 503, statusText: 'Unavailable' });
    component.salvar();
    http.expectNone('http://localhost:8080/clientes/me');
    expect(component.enderecos()).toEqual([endereco]);
    component.carregarEnderecos();
    http.expectOne('http://localhost:8080/clientes/me/enderecos').flush([novoPrincipal]);
    (navigation.querySelector('a[href="/meus-dados"]') as HTMLAnchorElement).click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(router.url).toBe('/meus-dados');
    expect(component.form.controls.nome.value).toBe('Nome atualizado');
    component.salvar();
    const save = http.expectOne('http://localhost:8080/clientes/me');
    expect(save.request.body.nome).toBe('Nome atualizado');
    expect(save.request.body.numero).toBe('200');
    expect(save.request.body.email).toBeUndefined();
    fixture.detectChanges();
    expect((root.querySelector('.profile-cancel') as HTMLButtonElement).disabled).toBe(true);
    save.flush({ ...perfil, nome: 'Nome atualizado' });
    http.expectOne('http://localhost:8080/clientes/me/enderecos').flush([novoPrincipal]);
    fixture.detectChanges();
    expect((root.querySelector('.profile-cancel') as HTMLButtonElement).disabled).toBe(true);

    await router.navigateByUrl('/lista-de-desejos');
    fixture.detectChanges();
    http.expectOne((r) => r.url.endsWith('/desejos')).flush({ items: [], totalItems: 0 });
    expect(root.querySelector('app-account-nav')).toBe(navigation);
    expect(root.querySelectorAll('app-account-nav')).toHaveLength(1);
  });

  it('keeps first-profile fields separate and directs incomplete registration to the address page', async () => {
    const auth = TestBed.inject(AuthService);
    auth.authenticated.set(true);
    auth.nome.set('Cliente');
    auth.email.set(perfil.email);
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(App);
    await router.navigateByUrl('/meus-dados');
    fixture.detectChanges();
    http
      .expectOne('http://localhost:8080/clientes/me')
      .flush({}, { status: 404, statusText: 'Not found' });
    fixture.detectChanges();
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const component = fixture.debugElement.query(By.directive(ClienteFormComponent))
      .componentInstance as ClienteFormComponent;
    expect(root.querySelector('.account-form input[formControlName="nome"]')).not.toBeNull();
    expect(root.querySelector('.account-form input[formControlName="cep"]')).toBeNull();
    component.salvar();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(router.url).toBe('/enderecos');
    expect(root.querySelector('.account-form input[formControlName="cep"]')).not.toBeNull();
    expect(root.querySelector('.account-form input[formControlName="nome"]')).toBeNull();
    component.form.patchValue({ cep: perfil.cep, numero: perfil.numero });
    component.consultarCep();
    http
      .expectOne('http://localhost:8080/ceps/01001000')
      .flush({ ...perfil, localidade: 'São Paulo', uf: 'SP' });
    component.salvar();
    http.expectOne('http://localhost:8080/clientes/me').flush(perfil);
    http.expectOne('http://localhost:8080/clientes/me/enderecos').flush([endereco]);
    fixture.detectChanges();
    expect(root.querySelector('.account-form')?.textContent).toContain('Meus endereços de entrega');
    expect(root.querySelector('.account-form input[formControlName="cep"]')).toBeNull();
  });

  it('opens addresses directly and retains checkout across the separate account pages', async () => {
    const auth = TestBed.inject(AuthService);
    auth.authenticated.set(true);
    auth.email.set(perfil.email);
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/enderecos?returnUrl=%2Fcheckout');
    fixture.detectChanges();
    http.expectOne('http://localhost:8080/clientes/me').flush(perfil);
    http.expectOne('http://localhost:8080/clientes/me/enderecos').flush([endereco]);
    fixture.detectChanges();
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const sidebar = root.querySelector('app-account-nav')!;
    expect(root.querySelector('.account-form h1')?.textContent).toContain('Endereços');
    expect(root.querySelector('[role="tab"]')).toBeNull();
    (
      sidebar.querySelector('a[href="/meus-dados?returnUrl=%2Fcheckout"]') as HTMLAnchorElement
    ).click();
    await fixture.whenStable();
    expect(router.url).toBe('/meus-dados?returnUrl=%2Fcheckout');
    (
      sidebar.querySelector('a[href="/enderecos?returnUrl=%2Fcheckout"]') as HTMLAnchorElement
    ).click();
    await fixture.whenStable();
    expect(router.url).toBe('/enderecos?returnUrl=%2Fcheckout');
    (
      sidebar.querySelector('a[href="/meus-dados?returnUrl=%2Fcheckout"]') as HTMLAnchorElement
    ).click();
    await fixture.whenStable();
    expect(router.url).toBe('/meus-dados?returnUrl=%2Fcheckout');
    expect(
      Array.from(sidebar.querySelectorAll('nav a')).map(
        (a) => a.getAttribute('href')?.split('?')[0],
      ),
    ).toEqual(['/meus-pedidos', '/meus-dados', '/enderecos', '/lista-de-desejos']);
    const component = fixture.debugElement.query(By.directive(ClienteFormComponent))
      .componentInstance as ClienteFormComponent;
    const navigation = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    component.salvar();
    http.expectOne('http://localhost:8080/clientes/me').flush(perfil);
    expect(navigation).toHaveBeenCalledWith('/checkout');
  });

  it('requires authentication before activating administrative resolvers', async () => {
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/mouses/editar/9');
    fixture.detectChanges();
    expect(TestBed.inject(Router).url).toBe('/login?returnUrl=%2Fadmin%2Fmouses%2Feditar%2F9');
    http.expectNone((request) => request.url.includes('/mouses/9'));
  });

  it('blocks customer navigation to administration before loading its data', async () => {
    const auth = TestBed.inject(AuthService);
    auth.authenticated.set(true);
    auth.roles.set(['customer']);
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/admin/clientes');
    fixture.detectChanges();
    expect(TestBed.inject(Router).url).toBe('/acesso-negado');
    http.expectNone((request) => request.url.includes('/clientes'));
  });

  it.each(['/', '/minha-conta'])(
    'opens the storefront from %s instead of an obsolete account page or administration',
    async (path) => {
      const fixture = TestBed.createComponent(App);
      await TestBed.inject(Router).navigateByUrl(path);
      fixture.detectChanges();
      http
        .expectOne('http://localhost:8080/catalogo/mouses?page=0&pageSize=3')
        .flush({ items: [], page: 0, pageSize: 12, totalItems: 0, totalPages: 0 });
      fixture.detectChanges();
      const element = fixture.nativeElement as HTMLElement;
      expect(TestBed.inject(Router).url).toBe('/');
      expect(element.querySelector('app-home h1')).not.toBeNull();
      expect(element.querySelector('app-storefront-layout')).not.toBeNull();
      expect(element.querySelector('app-admin-layout')).toBeNull();
      expect(element.querySelector('main#conteudo')).not.toBeNull();
    },
  );

  it.each(['/marcas', '/mouses', '/clientes'])(
    'redirects the existing %s route to protected administration',
    async (path) => {
      const auth = TestBed.inject(AuthService);
      auth.authenticated.set(true);
      auth.roles.set(['admin']);
      const fixture = TestBed.createComponent(App);
      await TestBed.inject(Router).navigateByUrl(path);
      fixture.detectChanges();
      http
        .expectOne((request) => request.url.startsWith('http://localhost:8080' + path))
        .flush(
          path === '/clientes'
            ? []
            : { items: [], page: 0, pageSize: 10, totalItems: 0, totalPages: 0 },
        );
      fixture.detectChanges();
      const element = fixture.nativeElement as HTMLElement;
      expect(TestBed.inject(Router).url).toBe('/admin' + path);
      expect(element.querySelector('app-admin-layout')).not.toBeNull();
      expect(element.querySelector('app-storefront-layout')).toBeNull();
      expect(element.querySelector('nav')?.textContent).toContain('Marcas');
      expect(element.querySelector('nav')?.textContent).toContain('Mouses');
      expect(element.querySelector('a[href="/"]')).not.toBeNull();
    },
  );
});
