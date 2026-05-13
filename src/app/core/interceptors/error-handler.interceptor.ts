import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MfeBridgeService } from '../services/mfe-bridge.service';
import { ErrorModelDto } from '../models/error-model.dto';

export const errorHandlerInterceptor: HttpInterceptorFn = (req, next) => {
  const mfeBridge = inject(MfeBridgeService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Ha ocurrido un error inesperado';
      const errorBody: ErrorModelDto = error.error;

      switch (error.status) {
        case 400:
          if (errorBody && errorBody.detail) {
            errorMessage = errorBody.detail;
            // Mostramos notificación de error de negocio
            alert(errorMessage); // TODO: Reemplazar con Toast service si está disponible
          }
          break;

        case 401:
          // Redirigir al login e invalidar sesión en la Shell
          mfeBridge.logout();
          break;

        case 404:
          // Si es una búsqueda (GET), informar específicamente
          if (req.method === 'GET') {
            alert('El registro solicitado no existe');
          } else {
            alert(errorBody?.detail || 'Recurso no encontrado');
          }
          break;

        case 500:
          alert('Hubo un problema en el servidor. Nuestro equipo técnico ha sido notificado.');
          break;

        default:
          alert(errorBody?.detail || errorMessage);
          break;
      }

      // Retornamos el error para que el componente pueda manejar errores de validación específicos si existen
      return throwError(() => error);
    })
  );
};
