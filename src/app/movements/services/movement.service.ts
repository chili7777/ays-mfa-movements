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
      'X-Guid': '00000000-0000-0000-0000-000000000000',
      'X-App': 'terminal-curl',
      'Accept': 'application/json'
    };

    if (isJson) {
      headers['Content-Type'] = 'application/json';
    }

    return new HttpHeaders(headers);
  }

  getAllMovements(params?: { accountId?: string, fromDate?: string, toDate?: string }): Observable<Movement[]> {
    let url = this.apiUrl;
    if (params) {
      const queryParams = new URLSearchParams();
      if (params.accountId) queryParams.append('accountId', params.accountId);
      if (params.fromDate) queryParams.append('fromDate', params.fromDate);
      if (params.toDate) queryParams.append('toDate', params.toDate);
      const query = queryParams.toString();
      if (query) url += `?${query}`;
    }

    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      map(response => {
        if (Array.isArray(response)) return response;
        if (response && response.data && Array.isArray(response.data)) return response.data;
        if (response && response.movements && Array.isArray(response.movements)) return response.movements;
        return [];
      })
    );
  }

  getMovementById(id: string): Observable<Movement> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() }).pipe(
      map(response => response.data || response.movement || response)
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
