import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Movement } from '../interfaces/movement.interface';

@Injectable({
  providedIn: 'root',
})
export class MovementService {
  private readonly http = inject(HttpClient);
  // URL base unificada para Cloud
  private readonly apiUrl = 'https://ays-msa-dm-cuaa-cr-account-stagi-zdpms.ondigitalocean.app/movements';

  private getHeaders(isJson = false): HttpHeaders {
    const headers: any = {
      'x-guid': '550e8400-e29b-41d4-a716-446655440000',
      'x-app': 'postman',
      'Accept': 'application/json'
    };

    if (isJson) {
      headers['Content-Type'] = 'application/json';
    }

    return new HttpHeaders(headers);
  }

  getAllMovements(params?: { accountId?: string, fromDate?: string, toDate?: string, movementType?: string }): Observable<Movement[]> {
    let url = this.apiUrl;
    if (params) {
      const queryParams = new URLSearchParams();
      if (params.accountId) queryParams.append('accountId', params.accountId);
      if (params.fromDate) queryParams.append('fromDate', params.fromDate);
      if (params.toDate) queryParams.append('toDate', params.toDate);
      if (params.movementType) queryParams.append('movementType', params.movementType);
      const query = queryParams.toString();
      if (query) url += `?${query}`;
    }

    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      map(response => {
        let data = [];
        if (Array.isArray(response)) data = response;
        else if (response && response.data && Array.isArray(response.data)) data = response.data;
        else if (response && response.movements && Array.isArray(response.movements)) data = response.movements;

        return data.map((m: any) => ({
          ...m,
          id: m.id || m._id || m.movementId || m.transactionId
        }));
      })
    );
  }

  getMovementById(id: string): Observable<Movement> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() }).pipe(
      map(response => {
        const m = response.data || response.movement || response;
        return {
          ...m,
          id: m.id || m._id || m.movementId || m.transactionId || id
        };
      })
    );
  }

  createMovement(movement: Partial<Movement>): Observable<any> {
    return this.http.post(this.apiUrl, movement, { headers: this.getHeaders(true) });
  }

  updateMovement(movement: Partial<Movement>, id: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, movement, { headers: this.getHeaders(true) });
  }

  patchMovement(movement: Partial<Movement>, id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}`, movement, { headers: this.getHeaders(true) });
  }

  deleteMovement(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  downloadAccountStatement(params: { customerId: string, startDate: string, endDate: string }): Observable<Blob> {
    const reportUrl = 'https://ays-msa-dm-cuaa-cr-account-stagi-zdpms.ondigitalocean.app/api/v1/reports/account-statement';

    // Headers requeridos por el backend
    const headers = new HttpHeaders({
      'x-guid': '550e8400-e29b-41d4-a716-446655440000',
      'x-app': 'ays-mfa-movements',
      'Accept': 'application/pdf'
    });

    return this.http.get(reportUrl, {
      params: {
        ...params,
        format: 'pdf'
      },
      headers: headers,
      responseType: 'blob'
    });
  }

  /**
   * Se suscribe al flujo de movimientos en tiempo real mediante SSE.
   * Si se proporciona accountId, se suscribe solo a los movimientos de esa cuenta.
   * @param accountId Opcional. ID de la cuenta para filtrar el stream.
   */
  getMovementStream(accountId?: string): Observable<Movement> {
    return new Observable<Movement>(observer => {
      const baseUrl = 'https://ays-msa-dm-cuaa-cr-account-stagi-zdpms.ondigitalocean.app';
      const url = accountId
        ? `${baseUrl}/accounts/${accountId}/movements/stream`
        : `${this.apiUrl}/stream`;

      console.log(`[SSE] Conectando a: ${url}`);

      const eventSource = new EventSource(url);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const movement: Movement = {
            ...data,
            id: data.movementId || data.id || data.transactionId
          };
          observer.next(movement);
        } catch (e) {
          console.error('[SSE] Error al parsear datos:', e);
        }
      };

      eventSource.onerror = (error) => {
        console.error('[SSE] Error de conexión:', error);
        // EventSource maneja la reconexión automática por defecto.
      };

      eventSource.onopen = () => {
        console.log('[SSE] Conexión abierta');
      };

      return () => {
        console.log('[SSE] Cerrando conexión');
        eventSource.close();
      };
    });
  }
}
