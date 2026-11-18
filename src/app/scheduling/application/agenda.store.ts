import {computed, inject, Injectable, signal} from '@angular/core';
import {HttpErrorResponse} from '@angular/common/http';
import {Observable} from 'rxjs';
import {VisitsApi} from '../infrastructure/visits-api';
import {Visit, VisitDraft} from '../domain/model/visit.entity';
import {VisitStatus} from '../domain/model/visit-type';
import {addDays, addMonths, DateKey, monthGrid, todayKey, weekDays} from '../domain/services/calendar';
import {conflictingVisits, technicianDay} from '../domain/services/visit-conflicts';
import {IamStore} from '../../iam/application/iam.store';

export type AgendaView = 'month' | 'week';
export type AgendaError = 'load' | 'save' | 'forbidden' | 'invalid';

/**
 * Agenda of technical visits: what the calendar shows (view, anchor date,
 * technician filter) and the visits of the visible range.
 *
 * @remarks
 * Everyone sees every visit; a visit can be changed only by whoever
 * scheduled it or by the CEO (`visits.edit-all`).
 */
@Injectable({providedIn: 'root'})
export class AgendaStore {
  private readonly api = inject(VisitsApi);
  private readonly iam = inject(IamStore);

  private readonly visitsSignal = signal<Visit[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly savingSignal = signal(false);
  private readonly errorSignal = signal<AgendaError | null>(null);

  readonly view = signal<AgendaView>('week');
  /** Any day inside the period shown. */
  readonly anchor = signal<DateKey>(todayKey());
  /** Technician to show, or null for all. */
  readonly technicianFilter = signal<number | null>(null);

  readonly loading = this.loadingSignal.asReadonly();
  readonly saving = this.savingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  /** Days of the visible period: 7 for a week, whole weeks for a month. */
  readonly days = computed<DateKey[]>(() =>
    this.view() === 'week' ? weekDays(this.anchor()) : monthGrid(this.anchor()).flat()
  );
  readonly weeks = computed(() => monthGrid(this.anchor()));
  readonly range = computed(() => {
    const days = this.days();
    return {from: days[0], to: days[days.length - 1]};
  });

  /** Visits of the visible range, filtered by technician, by date and time. */
  readonly visits = computed(() => {
    const filter = this.technicianFilter();
    return [...this.visitsSignal()]
      .filter(v => filter === null || v.technicianId === filter)
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  });

  /** Visits grouped by day key, for the calendar cells. */
  readonly byDay = computed(() => {
    const map = new Map<DateKey, Visit[]>();
    for (const v of this.visits()) map.set(v.date, [...(map.get(v.date) ?? []), v]);
    return map;
  });

  // ── navigation ──

  setView(view: AgendaView): void { this.view.set(view); this.load(); }

  goToday(): void { this.anchor.set(todayKey()); this.load(); }

  /** Moves one month or one week back (-1) or forward (+1). */
  move(step: -1 | 1): void {
    this.anchor.update(a => this.view() === 'week' ? addDays(a, 7 * step) : addMonths(a, step));
    this.load();
  }

  /** Opens the week that contains the given day. */
  openWeek(day: DateKey): void {
    this.anchor.set(day);
    this.setView('week');
  }

  // ── data ──

  load(): void {
    const {from, to} = this.range();
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.getRange(from, to).subscribe({
      next: visits => { this.visitsSignal.set(visits); this.loadingSignal.set(false); },
      error: () => { this.errorSignal.set('load'); this.loadingSignal.set(false); }
    });
  }

  /** Whoever scheduled the visit, or the CEO, can change it. */
  canEdit(visit: Visit): boolean {
    const user = this.iam.currentUser();
    return !!user && (visit.createdBy.id === user.id || this.iam.can('visits.edit-all'));
  }

  /** Same-technician visits less than an hour apart (a warning; saving is still allowed). */
  conflictsFor(candidate: {id?: number; technicianId: number; date: string; time: string}): Visit[] {
    return conflictingVisits(this.visitsSignal(), candidate);
  }

  /** The technician's other visits that day, shown while scheduling. */
  technicianDay(technicianId: number, date: string, exceptId?: number): Visit[] {
    return technicianDay(this.visitsSignal(), technicianId, date, exceptId);
  }

  create(draft: VisitDraft, onSaved?: (visit: Visit) => void): void {
    if (!isComplete(draft)) { this.errorSignal.set('invalid'); return; }
    this.save(this.api.create(clean(draft)), saved => {
      this.upsert(saved);
      onSaved?.(saved);
    });
  }

  update(visit: Visit, changes: Partial<VisitDraft>, onSaved?: (visit: Visit) => void): void {
    if (!this.canEdit(visit)) { this.errorSignal.set('forbidden'); return; }
    const next = {...visit, ...changes};
    if (!isComplete(next)) { this.errorSignal.set('invalid'); return; }
    this.save(this.api.update(visit.id, clean(changes)), saved => { this.upsert(saved); onSaved?.(saved); });
  }

  setStatus(visit: Visit, status: VisitStatus, onSaved?: (visit: Visit) => void): void {
    if (!this.canEdit(visit)) { this.errorSignal.set('forbidden'); return; }
    this.save(this.api.update(visit.id, {status}), saved => { this.upsert(saved); onSaved?.(saved); });
  }

  clearError(): void { this.errorSignal.set(null); }

  private upsert(saved: Visit): void {
    this.visitsSignal.update(list => [...list.filter(v => v.id !== saved.id), saved]);
  }

  private save(request$: Observable<Visit>, onSaved: (visit: Visit) => void): void {
    this.savingSignal.set(true);
    this.errorSignal.set(null);
    request$.subscribe({
      next: saved => { onSaved(saved); this.savingSignal.set(false); },
      error: (e: unknown) => {
        this.savingSignal.set(false);
        this.errorSignal.set(e instanceof HttpErrorResponse && e.status === 403 ? 'forbidden' : 'save');
      }
    });
  }
}

function isComplete(d: Partial<VisitDraft>): boolean {
  return !!d.date && /^\d{2}:\d{2}$/.test(d.time ?? '') && !!d.technicianId && !!d.type
    && !!d.title?.trim() && !!d.customer?.name?.trim() && !!d.customer?.phone?.trim() && !!d.address?.trim();
}

/**
 * Trims texts. Optional fields that were emptied are sent as "" so that an
 * update clears them on the server (leaving them out would keep the old value).
 */
function clean<T extends Partial<VisitDraft>>(d: T): T {
  const out: Partial<VisitDraft> = {...d};
  if (out.title !== undefined) out.title = out.title.trim();
  if (out.address !== undefined) out.address = out.address.trim();
  if (out.customer) out.customer = {name: out.customer.name.trim(), phone: out.customer.phone.trim()};
  for (const key of ['reference', 'specs'] as const) {
    if (key in out) out[key] = out[key]?.trim() ?? '';
  }
  return out as T;
}
