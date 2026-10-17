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
        ]),
        { provide: AuthService, useValue: { authenticated: signal(false), admin: signal(false) } },
        { provide: CarrinhoService, useValue: { quantidadeTotal: signal(2) } },
      ],
    });
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
