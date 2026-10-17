import { ApplicationConfig, LOCALE_ID, inject, provideAppInitializer } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { provideRouter, TitleStrategy, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { AuthService } from './services/auth.service';
import { authInterceptor } from './interceptors/auth.interceptor';
import { routes } from './app.routes';
import { SeoService } from './services/seo.service';

registerLocaleData(localePt);

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: TitleStrategy, useExisting: SeoService },
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    provideRouter(
      routes,
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }),
    ),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAppInitializer(() => inject(AuthService).initialize()),
  ],
};
