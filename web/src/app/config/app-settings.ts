import { InjectionToken } from '@angular/core';

export interface AppSettings {
  apiUrl: string;
  identityUrl: string;
  realm: string;
  clientId: string;
}

export const APP_SETTINGS = new InjectionToken<AppSettings>('APP_SETTINGS', {
  providedIn: 'root',
  factory: () => ({
    apiUrl: 'http://localhost:8080',
    identityUrl: 'http://localhost:8180',
    realm: 'mousetrap',
    clientId: 'mousetrap-web',
  }),
});
