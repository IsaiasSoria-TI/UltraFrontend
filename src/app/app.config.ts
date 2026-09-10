import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor])),
    provideRouter(routes),
    providePrimeNG({
      license: 'eyJpZCI6Ijk1NmNlODAyLTc2MTMtNGNkOS1hOTgyLWExOTg0N2Q5NTMyZCIsInByb2R1Y3QiOiJwcmltZXVpIiwidGllciI6ImNvbW11bml0eSIsInR5cGUiOiJkZXYiLCJpYXQiOjE3ODc1MzU1NTYsImV4cCI6MTgxOTA3MTU1Nn0.omv78PdA4Xj4NRPTUeA1aU9tcguN6ZPmKkMw_DrON_lMcPvXaE2EFuAe0uGYoEIFnARJL8-JEZ90PV3j0HXWCA',
      theme: {
        preset: Aura
      }
    })
  ]
};