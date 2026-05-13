import { ApplicationConfig, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { errorHandlerInterceptor } from './core/interceptors/error-handler.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'es' },
    provideRouter(routes),
    provideHttpClient(withInterceptors([errorHandlerInterceptor]))
  ]
};
