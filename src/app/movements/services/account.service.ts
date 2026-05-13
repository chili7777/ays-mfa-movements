import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'https://ays-msa-dm-cuaa-cr-account-stagi-zdpms.ondigitalocean.app/accounts';
  private readonly customerUrl = 'https://ays-msa-dm-cuaa-cr-account-stagi-zdpms.ondigitalocean.app/customers';

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'X-Guid': '00000000-0000-0000-0000-000000000000',
      'X-App': 'terminal-curl',
      'Accept': 'application/json'
    });
  }

  getAccounts(): Observable<any[]> {
    return this.http.get<any>(this.apiUrl, { headers: this.getHeaders() }).pipe(
      map(response => this.mapAccountsResponse(response))
    );
  }

  getAccountsByClientId(clientId: string): Observable<any[]> {
    const url = `${this.customerUrl}/${clientId}/accounts`;
    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      map(response => this.mapAccountsResponse(response))
    );
  }

  private mapAccountsResponse(response: any): any[] {
    if (Array.isArray(response)) return response;
    if (response && response.data && Array.isArray(response.data)) return response.data;
    if (response && response.accounts && Array.isArray(response.accounts)) return response.accounts;
    return [];
  }

  getAccountById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() }).pipe(
      map(response => response.data || response.account || response)
    );
  }
}
