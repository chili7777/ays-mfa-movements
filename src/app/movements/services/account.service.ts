import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, of, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'https://ays-msa-dm-cuaa-cr-account-stagi-zdpms.ondigitalocean.app/accounts';
  private readonly customerUrl = 'https://ays-msa-dm-cuaa-cr-account-stagi-zdpms.ondigitalocean.app/customers';

  // Caché simple
  private cachedAccounts: any[] | null = null;
  private cachedByClient: Map<string, any[]> = new Map();
  private cachedById: Map<string, any> = new Map();

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'x-guid': '550e8400-e29b-41d4-a716-446655440000',
      'x-app': 'postman',
      'Accept': 'application/json'
    });
  }

  getAccounts(): Observable<any[]> {
    if (this.cachedAccounts) return of(this.cachedAccounts);

    return this.http.get<any>(this.apiUrl, { headers: this.getHeaders() }).pipe(
      map(response => this.mapAccountsResponse(response)),
      tap(accounts => this.cachedAccounts = accounts)
    );
  }

  getAccountsByClientId(clientId: string): Observable<any[]> {
    if (this.cachedByClient.has(clientId)) {
      return of(this.cachedByClient.get(clientId)!);
    }

    const url = `${this.customerUrl}/${clientId}/accounts`;
    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      map(response => this.mapAccountsResponse(response)),
      tap(accounts => this.cachedByClient.set(clientId, accounts))
    );
  }

  private mapAccountsResponse(response: any): any[] {
    const data = Array.isArray(response) ? response :
                 (response && response.data && Array.isArray(response.data)) ? response.data :
                 (response && response.accounts && Array.isArray(response.accounts)) ? response.accounts : [];

    // Alimentar caché de IDs individuales
    data.forEach((acc: any) => {
      const id = acc.id || acc.accountId;
      if (id) this.cachedById.set(id, acc);
    });

    return data;
  }

  getAccountById(id: string): Observable<any> {
    if (this.cachedById.has(id)) return of(this.cachedById.get(id));

    return this.http.get<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() }).pipe(
      map(response => response.data || response.account || response),
      tap(acc => {
        if (acc) this.cachedById.set(id, acc);
      })
    );
  }

  getAccountByNumber(accountNumber: string): Observable<any> {
    const url = `${this.apiUrl}?accountNumber=${accountNumber}`;
    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      map(response => {
        const accounts = this.mapAccountsResponse(response);
        return accounts.length > 0 ? accounts[0] : null;
      })
    );
  }

  clearCache(): void {
    this.cachedAccounts = null;
    this.cachedByClient.clear();
    this.cachedById.clear();
  }
}
