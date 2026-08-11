import {Injectable} from '@angular/core';
import {Observable, of, delay} from 'rxjs';
import {Product} from '../domain/model/product.entity';
import {Customer} from '../domain/model/customer.entity';

/**
 * Infrastructure API for the Sales bounded context.
 * Currently uses mock data; replace with real HTTP calls when backend is ready.
 */
@Injectable({ providedIn: 'root' })
export class SalesApi {
  getProducts(): Observable<Product[]> {
    return of([]).pipe(delay(0)); // mock – store holds initial data
  }

  getCustomers(): Observable<Customer[]> {
    return of([]).pipe(delay(0)); // mock – store holds initial data
  }
}

