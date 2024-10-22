import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';
import { MessageService } from 'primeng/api';

@Injectable()
export class BackendErrorInterceptor implements HttpInterceptor {
  #messageService = inject(MessageService);

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError(event => {
        if (event instanceof HttpErrorResponse && event.status >= 400 && typeof event.error === 'object') {
          this.#messageService.add({
            severity: 'error',
            summary: 'Backend Error - ' + event.status,
            detail: event.error.message || 'Unknown error'
          });
        }

        return of(event);
      })
    );
  }
}
