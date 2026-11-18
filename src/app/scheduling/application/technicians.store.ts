import {computed, inject, Injectable, signal} from '@angular/core';
import {Observable} from 'rxjs';
import {TechniciansApi} from '../infrastructure/technicians-api';
import {Technician, TECHNICIAN_COLORS} from '../domain/model/technician.entity';

export type TechniciansError = 'load' | 'save' | 'invalid';

/** Technicians registered by the CEO. Sellers only read the active ones. */
@Injectable({providedIn: 'root'})
export class TechniciansStore {
  private readonly api = inject(TechniciansApi);

  private readonly techniciansSignal = signal<Technician[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly savingSignal = signal(false);
  private readonly errorSignal = signal<TechniciansError | null>(null);
  private loaded = false;

  /** Active first, then by name. */
  readonly all = computed(() =>
    [...this.techniciansSignal()].sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name))
  );
  readonly active = computed(() => this.all().filter(t => t.active));
  readonly loading = this.loadingSignal.asReadonly();
  readonly saving = this.savingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  private readonly byId = computed(() => new Map(this.techniciansSignal().map(t => [t.id, t])));

  ensureLoaded(): void {
    if (!this.loaded && !this.loadingSignal()) this.load();
  }

  load(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.getAll().subscribe({
      next: list => { this.techniciansSignal.set(list); this.loadingSignal.set(false); this.loaded = true; },
      error: () => { this.errorSignal.set('load'); this.loadingSignal.set(false); }
    });
  }

  find(id: number): Technician | undefined { return this.byId().get(id); }

  /** A colour not yet used by an active technician, for new technicians. */
  nextColor(): string {
    const used = new Set(this.active().map(t => t.color));
    return TECHNICIAN_COLORS.find(c => !used.has(c)) ?? TECHNICIAN_COLORS[this.techniciansSignal().length % TECHNICIAN_COLORS.length];
  }

  create(name: string, phone: string, color: string, onSaved?: (t: Technician) => void): boolean {
    if (!name.trim() || phone.replace(/\D/g, '').length < 6) { this.errorSignal.set('invalid'); return false; }
    this.save(this.api.create({name: name.trim(), phone: phone.trim(), color, active: true}), saved => {
      this.techniciansSignal.update(list => [...list, saved]);
      onSaved?.(saved);
    });
    return true;
  }

  update(technician: Technician, changes: Partial<Omit<Technician, 'id'>>): void {
    this.save(this.api.update(technician.id, changes),
      saved => this.techniciansSignal.update(list => list.map(t => t.id === saved.id ? saved : t)));
  }

  clearError(): void { this.errorSignal.set(null); }

  private save(request$: Observable<Technician>, onSaved: (t: Technician) => void): void {
    this.savingSignal.set(true);
    this.errorSignal.set(null);
    request$.subscribe({
      next: saved => { onSaved(saved); this.savingSignal.set(false); },
      error: () => { this.errorSignal.set('save'); this.savingSignal.set(false); }
    });
  }
}
