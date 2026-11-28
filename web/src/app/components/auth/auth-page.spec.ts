import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { AuthPageComponent } from './auth-page';
import { AuthService } from '../../services/auth.service';

describe('AuthPageComponent', () => {
  function criarAuthMock() {
    return {
      authenticated: signal(false),
      admin: signal(false),
      error: signal(''),
      redirecting: signal(false),
      entrar: vi.fn().mockResolvedValue('/'),
      cadastrar: vi.fn().mockResolvedValue('/enderecos'),
    };
  }

  it('validates login form and submits credentials through AuthService.entrar', async () => {
    const authMock = criarAuthMock();
    TestBed.configureTestingModule({
      imports: [AuthPageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: { mode: 'login' },
              queryParamMap: convertToParamMap({ returnUrl: '/checkout' }),
            },
          },
        },
      ],
    });
    const router = TestBed.inject(Router);
    const navSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(AuthPageComponent);
    fixture.detectChanges();

    await fixture.componentInstance.submeterLogin();
    expect(authMock.entrar).not.toHaveBeenCalled();

    fixture.componentInstance.loginForm.setValue({
      email: 'CLIENTE@EXAMPLE.COM ',
      senha: 'SenhaForte1',
    });
    await fixture.componentInstance.submeterLogin();

    expect(authMock.entrar).toHaveBeenCalledWith(
      { email: 'cliente@example.com', senha: 'SenhaForte1' },
      '/checkout',
    );
    expect(navSpy).toHaveBeenCalledWith('/', { replaceUrl: true });
  });

  it('validates password confirmation and submits registration through AuthService.cadastrar', async () => {
    const authMock = criarAuthMock();
    TestBed.configureTestingModule({
      imports: [AuthPageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: { mode: 'cadastro' },
              queryParamMap: convertToParamMap({}),
            },
          },
        },
      ],
    });
    const router = TestBed.inject(Router);
    const navSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(AuthPageComponent);
    fixture.detectChanges();

    fixture.componentInstance.cadastroForm.patchValue({
      nome: 'Rafael Pacini',
      email: 'rafael@example.com',
      senha: 'SenhaForte1',
      confirmarSenha: 'OutraSenha1',
    });
    await fixture.componentInstance.submeterCadastro();
    expect(authMock.cadastrar).not.toHaveBeenCalled();

    fixture.componentInstance.cadastroForm.patchValue({
      confirmarSenha: 'SenhaForte1',
      telefone: '(63) 99999-0000',
    });
    await fixture.componentInstance.submeterCadastro();

    expect(authMock.cadastrar).toHaveBeenCalledWith(
      {
        nome: 'Rafael Pacini',
        email: 'rafael@example.com',
        senha: 'SenhaForte1',
        telefone: '63999990000',
      },
      undefined,
    );
    expect(navSpy).toHaveBeenCalledWith('/enderecos', { replaceUrl: true });
  });
});
