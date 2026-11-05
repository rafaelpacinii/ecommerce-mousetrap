import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CarrinhoService } from '../../services/carrinho.service';
import { StorefrontLayoutComponent } from './storefront-layout';

@Component({ standalone: true, template: '' })
class DestinationComponent {}

describe('Storefront navigation', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [StorefrontLayoutComponent],
      providers: [
        provideRouter([
          { path: 'catalogo', component: DestinationComponent },
          { path: 'login', component: DestinationComponent },
          { path: 'meus-dados', component: DestinationComponent },
          { path: 'meus-pedidos', component: DestinationComponent },
        ]),
        { provide: AuthService, useValue: { authenticated: signal(false), admin: signal(false) } },
        { provide: CarrinhoService, useValue: { quantidadeTotal: signal(2) } },
      ],
    });
  });

  it.each([false, true])(
    'opens the named account menu and navigates to personal settings from its links (admin=%s)',
    async (admin) => {
      const logout = vi.fn();
      TestBed.overrideProvider(AuthService, {
        useValue: {
          authenticated: signal(true),
          admin: signal(admin),
          nome: signal('Rafael Pacini'),
          logout,
        },
      });
      const fixture = TestBed.createComponent(StorefrontLayoutComponent);
      await TestBed.inject(Router).navigateByUrl('/catalogo');
      fixture.detectChanges();
      const root = fixture.nativeElement as HTMLElement;
      const menu = root.querySelector('.account-menu') as HTMLDetailsElement;
      const profile = menu.querySelector('a[href="/meus-dados"]') as HTMLAnchorElement;
      expect(root.querySelector('.account-name')?.textContent?.trim()).toBe('Rafael');
      expect(menu.querySelector('summary')?.getAttribute('aria-label')).toBe(
        'Opções da conta de Rafael Pacini',
      );
      expect(profile).not.toBeNull();
      expect(menu.querySelector('a[href="/enderecos"]')).not.toBeNull();
      expect(!!menu.querySelector('a[href="/admin/pedidos"]')).toBe(admin);
      expect(menu.querySelector('a[href="/lista-de-desejos"]')).not.toBeNull();

      fixture.componentInstance.menuAberto.set(true);
      menu.open = true;
      profile.click();
      await fixture.whenStable();
      expect(TestBed.inject(Router).url).toBe('/meus-dados');
      expect(fixture.componentInstance.menuAberto()).toBe(false);
      expect(menu.open).toBe(false);

      menu.open = true;
      menu
        .querySelector('summary')!
        .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      expect(menu.open).toBe(false);

      menu.open = true;
      (menu.querySelector('a[href="/meus-pedidos"]') as HTMLAnchorElement).click();
      await fixture.whenStable();
      expect(TestBed.inject(Router).url).toBe('/meus-pedidos');
      expect(menu.open).toBe(false);

      menu.open = true;
      menu.querySelector('button')!.click();
      expect(logout).toHaveBeenCalledOnce();
      expect(menu.open).toBe(false);
    },
  );

  it.each([
    ['  José  da Silva  ', 'José'],
    ['abcdefghijklmnop Sobrenome', 'abcdefghijklmnop'],
    ['abcdefghijklmnopq Sobrenome', 'abcdefghijklm...'],
    ['', 'Sua conta'],
  ])('shows only a bounded first name in the header for %s', (nome, exibido) => {
    TestBed.overrideProvider(AuthService, {
      useValue: { authenticated: signal(true), admin: signal(false), nome: signal(nome) },
    });
    const fixture = TestBed.createComponent(StorefrontLayoutComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.account-name').textContent.trim()).toBe(exibido);
  });

  it('submits a trimmed name to the catalog and closes mobile navigation', async () => {
    const fixture = TestBed.createComponent(StorefrontLayoutComponent);
    fixture.detectChanges();
    fixture.componentInstance.menuAberto.set(true);
    const input = fixture.nativeElement.querySelector('.header-search input') as HTMLInputElement;
    input.value = '  Mouse sem fio  ';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.nativeElement.querySelector('.header-search').dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/catalogo?nome=Mouse%20sem%20fio');
    expect(fixture.componentInstance.menuAberto()).toBe(false);
  });

  it('uses the minimal brand header on login and restores catalog navigation afterward', async () => {
    const fixture = TestBed.createComponent(StorefrontLayoutComponent);
    await TestBed.inject(Router).navigateByUrl('/login?returnUrl=%2Fcheckout');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.brand')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('#store-navigation')).toBeNull();
    expect(fixture.nativeElement.querySelector('.store-footer')).toBeNull();
    await TestBed.inject(Router).navigateByUrl('/catalogo');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#store-navigation')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.cart-badge')?.textContent).toBe('2');
  });
});
