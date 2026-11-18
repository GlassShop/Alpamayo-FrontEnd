import {TestBed} from '@angular/core/testing';
import {signal} from '@angular/core';
import {HttpErrorResponse} from '@angular/common/http';
import {Observable, of, throwError} from 'rxjs';
import {UsersStore} from './users.store';
import {IamStore} from './iam.store';
import {NewUser, UsersApi} from '../infrastructure/users-api';
import {User} from '../domain/model/user.entity';

const ceo: User = {id: 1, username: 'ceo', fullName: 'Gerencia', role: 'CEO', active: true};
const seller: User = {id: 2, username: 'vendedora', fullName: 'Ana', role: 'SELLER', active: true};

/** In-memory UsersApi that records the calls it receives. */
class FakeUsersApi {
  users: User[] = [ceo, seller];
  calls: unknown[] = [];
  failWith: number | null = null;
  getAll(): Observable<User[]> { return of(this.users); }
  create(user: NewUser): Observable<User> {
    this.calls.push(['create', user]);
    if (this.failWith) return throwError(() => new HttpErrorResponse({status: this.failWith!}));
    return of({id: 9, username: user.username, fullName: user.fullName, role: user.role, active: true});
  }
  update(id: number, changes: Partial<User> & {password?: string}): Observable<User> {
    this.calls.push(['update', id, changes]);
    const {password, ...rest} = changes;
    return of({...this.users.find(u => u.id === id)!, ...rest});
  }
}

describe('UsersStore', () => {
  let store: UsersStore;
  let api: FakeUsersApi;

  beforeEach(() => {
    api = new FakeUsersApi();
    TestBed.configureTestingModule({providers: [
      {provide: UsersApi, useValue: api},
      {provide: IamStore, useValue: {currentUser: signal(ceo)}},
    ]});
    store = TestBed.inject(UsersStore);
    store.load();
  });

  it('creates an account with its role and a lower-case username', () => {
    expect(store.create({username: ' MRuiz ', fullName: 'María Ruiz', role: 'WAREHOUSE', password: 'maria-12345'})).toBe(true);
    expect(api.calls[0]).toEqual(['create', {username: 'mruiz', fullName: 'María Ruiz', role: 'WAREHOUSE', password: 'maria-12345'}]);
    expect(store.users().map(u => u.username)).toContain('mruiz');
    expect(store.notice()).toBe('created');
  });

  it('rejects weak passwords, duplicated usernames and usernames with spaces', () => {
    expect(store.create({username: 'nuevo', fullName: 'X', role: 'SELLER', password: 'short'})).toBe(false);
    expect(store.error()).toBe('weak-password');
    expect(store.create({username: 'Vendedora', fullName: 'X', role: 'SELLER', password: '12345678'})).toBe(false);
    expect(store.error()).toBe('duplicate-username');
    expect(store.create({username: 'dos palabras', fullName: 'X', role: 'SELLER', password: '12345678'})).toBe(false);
    expect(store.error()).toBe('invalid-user');
    expect(api.calls).toEqual([]);
  });

  it('reports a username taken on the server (409)', () => {
    api.failWith = 409;
    store.create({username: 'otro', fullName: 'Otro', role: 'SELLER', password: '12345678'});
    expect(store.error()).toBe('duplicate-username');
  });

  it('changes roles, deactivates and reactivates other accounts', () => {
    store.changeRole(seller, 'WAREHOUSE');
    expect(store.users().find(u => u.id === 2)?.role).toBe('WAREHOUSE');
    store.setActive(store.users().find(u => u.id === 2)!, false);
    expect(store.users().find(u => u.id === 2)?.active).toBe(false);
    expect(store.notice()).toBe('deactivated');
  });

  it('resets a password without keeping it in the store', () => {
    expect(store.resetPassword(seller, 'nueva-clave-1')).toBe(true);
    expect(api.calls.at(-1)).toEqual(['update', 2, {password: 'nueva-clave-1'}]);
    expect(JSON.stringify(store.users())).not.toContain('nueva-clave-1');
    expect(store.resetPassword(seller, '123')).toBe(false);
  });

  it('never lets the CEO lock themselves or the business out', () => {
    store.setActive(ceo, false);
    expect(store.error()).toBe('self-deactivate');
    store.changeRole(ceo, 'SELLER');
    expect(store.error()).toBe('self-demote');
    expect(api.calls).toEqual([]);
  });

  it('keeps at least one active CEO', () => {
    const otherCeo: User = {id: 3, username: 'socio', fullName: 'Socio', role: 'CEO', active: true};
    api.users = [{...ceo, active: false}, otherCeo, seller];
    store.load();
    store.setActive(otherCeo, false);
    expect(store.error()).toBe('last-ceo');
  });
});
