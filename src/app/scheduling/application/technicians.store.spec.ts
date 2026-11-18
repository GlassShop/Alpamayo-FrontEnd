import {TestBed} from '@angular/core/testing';
import {HttpErrorResponse} from '@angular/common/http';
import {Observable, of, throwError} from 'rxjs';
import {TechniciansStore} from './technicians.store';
import {TechniciansApi} from '../infrastructure/technicians-api';
import {Technician, TECHNICIAN_COLORS} from '../domain/model/technician.entity';

class FakeTechniciansApi {
  stored: Technician[] = [
    {id: 1, name: 'Pedro', phone: '943000222', color: TECHNICIAN_COLORS[1], active: true},
    {id: 2, name: 'Alberto', phone: '943000111', color: TECHNICIAN_COLORS[0], active: false},
    {id: 3, name: 'Juan', phone: '943000333', color: TECHNICIAN_COLORS[0], active: true},
  ];
  calls = 0;
  sent: unknown[] = [];
  failWith: number | null = null;
  getAll(): Observable<Technician[]> { this.calls++; return of(this.stored); }
  create(t: Omit<Technician, 'id'>): Observable<Technician> { return this.answer(['create', t], {...t, id: 4}); }
  update(id: number, changes: Partial<Technician>): Observable<Technician> {
    const saved = {...this.stored.find(t => t.id === id)!, ...changes};
    if (!this.failWith) this.stored = this.stored.map(t => t.id === id ? saved : t);
    return this.answer(['update', id, changes], saved);
  }
  private answer(call: unknown, result: Technician): Observable<Technician> {
    this.sent.push(call);
    return this.failWith ? throwError(() => new HttpErrorResponse({status: this.failWith!})) : of(result);
  }
}

describe('TechniciansStore', () => {
  let store: TechniciansStore;
  let api: FakeTechniciansApi;

  beforeEach(() => {
    api = new FakeTechniciansApi();
    TestBed.configureTestingModule({providers: [{provide: TechniciansApi, useValue: api}]});
    store = TestBed.inject(TechniciansStore);
    store.ensureLoaded();
  });

  it('loads once and lists the active technicians first, by name', () => {
    store.ensureLoaded();
    expect(api.calls).toBe(1);
    expect(store.all().map(t => t.name)).toEqual(['Juan', 'Pedro', 'Alberto']);
    expect(store.active().map(t => t.id)).toEqual([3, 1]);
    expect(store.find(2)?.name).toBe('Alberto');
  });

  it('suggests a colour no active technician uses yet', () => {
    expect(store.nextColor()).toBe(TECHNICIAN_COLORS[2]);
  });

  it('creates an active technician with trimmed texts', () => {
    let saved: Technician | undefined;
    expect(store.create('  Luis ', ' 943 000 444 ', TECHNICIAN_COLORS[2], t => saved = t)).toBe(true);
    expect(saved?.id).toBe(4);
    expect(store.nextColor()).toBe(TECHNICIAN_COLORS[3]);
    expect(api.sent[0]).toEqual(['create', {name: 'Luis', phone: '943 000 444', color: TECHNICIAN_COLORS[2], active: true}]);
    expect(store.active().map(t => t.name)).toContain('Luis');
  });

  it('rejects a technician without name or a valid phone', () => {
    expect(store.create(' ', '943000444', '#000000')).toBe(false);
    expect(store.create('Luis', '12-3', '#000000')).toBe(false);
    expect(store.error()).toBe('invalid');
    expect(api.sent).toEqual([]);
  });

  it('edits and deactivates a technician without deleting it', () => {
    store.update(store.find(1)!, {phone: '943999888'});
    store.update(store.find(1)!, {active: false});
    expect(api.sent).toEqual([['update', 1, {phone: '943999888'}], ['update', 1, {active: false}]]);
    expect(store.find(1)).toMatchObject({phone: '943999888', active: false});
    expect(store.active().map(t => t.id)).toEqual([3]);
  });

  it('reports a failed save', () => {
    api.failWith = 403;
    store.update(store.find(1)!, {color: '#000000'});
    expect(store.error()).toBe('save');
    expect(store.saving()).toBe(false);
  });
});
