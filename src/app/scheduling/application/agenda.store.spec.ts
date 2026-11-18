import {TestBed} from '@angular/core/testing';
import {signal} from '@angular/core';
import {HttpErrorResponse} from '@angular/common/http';
import {Observable, of, throwError} from 'rxjs';
import {AgendaStore} from './agenda.store';
import {VisitsApi} from '../infrastructure/visits-api';
import {Visit, VisitDraft} from '../domain/model/visit.entity';
import {IamStore} from '../../iam/application/iam.store';

const draft: VisitDraft = {
  date: '2026-11-19', time: '10:00', technicianId: 1, type: 'MEASUREMENT', title: 'Medición de puerta',
  customer: {name: 'Cliente Demo', phone: '943111222'}, address: 'Jr. Demo 1',
};

const visit = (id: number, overrides: Partial<Visit> = {}): Visit => ({
  ...draft, id, status: 'SCHEDULED', createdBy: {id: 2, fullName: 'Vendedora'}, createdAt: '2026-11-18T10:00:00Z',
  changes: [], ...overrides,
});

class FakeVisitsApi {
  stored: Visit[] = [
    visit(1),
    visit(2, {technicianId: 2, time: '15:00', date: '2026-11-20', createdBy: {id: 1, fullName: 'CEO'}}),
  ];
  ranges: [string, string][] = [];
  sent: unknown[] = [];
  failWith: number | null = null;
  getRange(from: string, to: string): Observable<Visit[]> { this.ranges.push([from, to]); return of(this.stored); }
  create(d: VisitDraft): Observable<Visit> { return this.answer(['create', d], visit(3, d)); }
  update(id: number, changes: object): Observable<Visit> {
    const current = this.stored.find(v => v.id === id)!;
    return this.answer(['update', id, changes], {...current, ...changes} as Visit);
  }
  private answer(call: unknown, result: Visit): Observable<Visit> {
    this.sent.push(call);
    return this.failWith ? throwError(() => new HttpErrorResponse({status: this.failWith!})) : of(result);
  }
}

class FakeIam {
  readonly currentUser = signal<{id: number} | null>({id: 2});
  ceo = false;
  can(permission: string): boolean { return permission === 'visits.edit-all' ? this.ceo : true; }
}

describe('AgendaStore', () => {
  let store: AgendaStore;
  let api: FakeVisitsApi;
  let iam: FakeIam;

  beforeEach(() => {
    api = new FakeVisitsApi();
    iam = new FakeIam();
    TestBed.configureTestingModule({providers: [{provide: VisitsApi, useValue: api}, {provide: IamStore, useValue: iam}]});
    store = TestBed.inject(AgendaStore);
    store.anchor.set('2026-11-19');
    store.load();
  });

  it('loads the visible week (Monday to Sunday) and the whole month grid', () => {
    expect(api.ranges.at(-1)).toEqual(['2026-11-16', '2026-11-22']);
    store.setView('month');
    expect(api.ranges.at(-1)).toEqual(['2026-10-26', '2026-12-06']);
  });

  it('navigates by week or by month and opens the week of a day', () => {
    store.move(1);
    expect(store.range()).toEqual({from: '2026-11-23', to: '2026-11-29'});
    store.setView('month');
    store.move(1);
    expect(store.anchor()).toBe('2026-12-01');
    store.openWeek('2026-12-24');
    expect(store.view()).toBe('week');
    expect(store.range()).toEqual({from: '2026-12-21', to: '2026-12-27'});
  });

  it('groups visits by day and filters them by technician', () => {
    expect(store.byDay().get('2026-11-19')?.map(v => v.id)).toEqual([1]);
    store.technicianFilter.set(2);
    expect(store.visits().map(v => v.id)).toEqual([2]);
    expect(store.byDay().has('2026-11-19')).toBe(false);
  });

  it('lets the author or the CEO edit a visit, nobody else', () => {
    expect(store.canEdit(api.stored[0])).toBe(true);   // created by user 2
    expect(store.canEdit(api.stored[1])).toBe(false);  // created by user 1
    iam.ceo = true;
    expect(store.canEdit(api.stored[1])).toBe(true);
    iam.currentUser.set(null);
    expect(store.canEdit(api.stored[0])).toBe(false);
  });

  it('creates a visit with trimmed texts and shows it in the calendar', () => {
    let saved: Visit | undefined;
    store.create({...draft, title: '  Reparar mampara ', reference: '  ', time: '11:30'}, v => saved = v);
    expect(api.sent[0]).toEqual(['create', expect.objectContaining({title: 'Reparar mampara', reference: ''})]);
    expect(saved?.id).toBe(3);
    expect(store.byDay().get('2026-11-19')?.map(v => v.id)).toEqual([1, 3]);
  });

  it('rejects incomplete visits without calling the server', () => {
    store.create({...draft, address: ' '});
    expect(store.error()).toBe('invalid');
    store.create({...draft, time: '9'});
    expect(store.error()).toBe('invalid');
    expect(api.sent).toEqual([]);
  });

  it('changes the technician and time, and clears an emptied reference', () => {
    store.update({...api.stored[0], reference: 'Casa azul'}, {technicianId: 2, time: '11:00', reference: ''});
    expect(api.sent[0]).toEqual(['update', 1, {technicianId: 2, time: '11:00', reference: ''}]);
    expect(store.visits().find(v => v.id === 1)).toMatchObject({technicianId: 2, time: '11:00'});
  });

  it('does not send changes to a visit the user cannot edit', () => {
    store.update(api.stored[1], {time: '16:00'});
    store.setStatus(api.stored[1], 'CANCELLED');
    expect(store.error()).toBe('forbidden');
    expect(api.sent).toEqual([]);
  });

  it('cancels or completes a visit instead of deleting it', () => {
    store.setStatus(api.stored[0], 'CANCELLED');
    expect(api.sent[0]).toEqual(['update', 1, {status: 'CANCELLED'}]);
    expect(store.visits().find(v => v.id === 1)?.status).toBe('CANCELLED');
  });

  it('maps a 403 from the server to "forbidden" and other failures to "save"', () => {
    api.failWith = 403;
    store.setStatus(api.stored[0], 'DONE');
    expect(store.error()).toBe('forbidden');
    api.failWith = 500;
    store.create(draft);
    expect(store.error()).toBe('save');
    expect(store.saving()).toBe(false);
  });

  it('warns about the same technician less than an hour apart, ignoring the visit itself', () => {
    expect(store.conflictsFor({technicianId: 1, date: '2026-11-19', time: '10:30'}).map(v => v.id)).toEqual([1]);
    expect(store.conflictsFor({id: 1, technicianId: 1, date: '2026-11-19', time: '10:30'})).toEqual([]);
    expect(store.conflictsFor({technicianId: 2, date: '2026-11-19', time: '10:30'})).toEqual([]);
  });
});
