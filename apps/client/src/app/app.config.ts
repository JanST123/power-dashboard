import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { BackendErrorInterceptor } from './http-interceptors/backend-error-interceptor';
import { MessageService } from 'primeng/api';
import { provideAnimations } from '@angular/platform-browser/animations';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(),
    provideHttpClient(withInterceptorsFromDi()),
    provideRouter(routes),
    provideZoneChangeDetection({ eventCoalescing: true }),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: BackendErrorInterceptor,
      multi: true
    },
    MessageService,
  ],
};
