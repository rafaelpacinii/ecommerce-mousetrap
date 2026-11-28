import { InjectionToken } from '@angular/core';

export interface AppSettings {
  apiUrl: string;
}

export const APP_SETTINGS = new InjectionToken<AppSettings>('APP_SETTINGS', {
  providedIn: 'root',
  factory: () => ({
    apiUrl: 'http://localhost:8080',
  }),
});
