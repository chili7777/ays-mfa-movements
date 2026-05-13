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
}
