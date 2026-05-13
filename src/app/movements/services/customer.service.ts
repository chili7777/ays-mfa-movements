import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Customer } from '../interfaces/customer.interface';

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'https://ays-msa-dm-cuaa-cr-account-stagi-zdpms.ondigitalocean.app/customers';

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'x-guid': '550e8400-e29b-41d4-a716-446655440000',
      'x-app': 'postman-test',
      'Accept': 'application/json'
    });
  }

  getCustomers(): Observable<Customer[]> {
    return this.http.get<any>(this.apiUrl, { headers: this.getHeaders() }).pipe(
      map(response => {
        let customers = [];
        if (Array.isArray(response)) customers = response;
        else if (response && response.data && Array.isArray(response.data)) customers = response.data;
        else if (response && response.customers && Array.isArray(response.customers)) customers = response.customers;

        return customers.map((c: any) => {
          const uuid = c.uuid || c.id || c.customerId || c._id || c.idCustomer;
          return {
            ...c,
            id: uuid || c.identification
          };
        });
      })
    );
  }

  getCustomerById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() }).pipe(
      map(response => response.data || response.customer || response)
    );
  }
}
