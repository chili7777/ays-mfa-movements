import { FormGroup } from '@angular/forms';
import { ErrorModelDto } from '../models/error-model.dto';

/**
 * Mapea los errores de validación del backend a los controles de un FormGroup de Angular.
 * Se asume que el backend envía el nombre del campo en la propiedad 'message' con formato "campo: descripción"
 * o que simplemente el nombre del campo se puede inferir.
 */
export function mapBackendErrorsToForm(error: any, form: FormGroup): void {
  const errorBody: ErrorModelDto = error.error;

  if (errorBody && errorBody.errors && Array.isArray(errorBody.errors)) {
    errorBody.errors.forEach(err => {
      // Intentar extraer el nombre del campo del mensaje (ej: "amount: debe ser positivo")
      const fieldName = err.message.split(':')[0].trim();
      const control = form.get(fieldName);

      if (control) {
        control.setErrors({
          backendError: err.businessMessage
        });
        control.markAsTouched();
      }
    });
  }
}
