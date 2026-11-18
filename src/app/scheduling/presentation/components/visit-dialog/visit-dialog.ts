import {Component, computed, ElementRef, inject, OnInit} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {toSignal} from '@angular/core/rxjs-interop';
import {startWith} from 'rxjs';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {AgendaStore} from '../../../application/agenda.store';
import {TechniciansStore} from '../../../application/technicians.store';
import {Visit, VisitDraft} from '../../../domain/model/visit.entity';
import {VISIT_TYPES, VisitType} from '../../../domain/model/visit-type';
import {todayKey} from '../../../domain/services/calendar';
import {BaseForm} from '../../../../shared/presentation/components/base-form/base-form';
import {agendaLocale, longDay} from '../../visit-format';

export interface VisitDialogData {
  /** Visit to edit; omitted to create a new one. */
  visit?: Visit;
  /** Values to pre-fill a new visit (e.g. a clicked slot or a saved quote). */
  prefill?: Partial<VisitDraft>;
}

/**
 * Schedules or edits a technical visit. While choosing technician, date and
 * time it shows that technician's other visits of the day and warns about
 * visits less than an hour apart, without blocking: the seller decides.
 */
@Component({
  selector: 'app-visit-dialog',
  imports: [ReactiveFormsModule, TranslatePipe, MatIconModule],
  templateUrl: './visit-dialog.html',
  styleUrl: './visit-dialog.css'
})
export class VisitDialog extends BaseForm implements OnInit {
  readonly agenda = inject(AgendaStore);
  readonly technicians = inject(TechniciansStore);
  private readonly ref = inject(MatDialogRef<VisitDialog, Visit>);
  private readonly data = inject<VisitDialogData | null>(MAT_DIALOG_DATA, {optional: true});
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly translate = inject(TranslateService);

  readonly types = VISIT_TYPES;
  readonly editing = this.data?.visit ?? null;

  readonly form = new FormGroup({
    date: new FormControl(todayKey(), {nonNullable: true, validators: [Validators.required]}),
    time: new FormControl('09:00', {nonNullable: true, validators: [Validators.required, Validators.pattern(/^\d{2}:\d{2}$/)]}),
    technicianId: new FormControl<number | null>(null, {validators: [Validators.required]}),
    type: new FormControl<VisitType>('MEASUREMENT', {nonNullable: true}),
    title: new FormControl('', {nonNullable: true, validators: [Validators.required, Validators.maxLength(100)]}),
    customerName: new FormControl('', {nonNullable: true, validators: [Validators.required, Validators.maxLength(100)]}),
    customerPhone: new FormControl('', {nonNullable: true, validators: [Validators.required, Validators.pattern(/^\+?[\d\s-]{6,15}$/)]}),
    address: new FormControl('', {nonNullable: true, validators: [Validators.required, Validators.maxLength(160)]}),
    reference: new FormControl('', {nonNullable: true, validators: [Validators.maxLength(160)]}),
    specs: new FormControl('', {nonNullable: true, validators: [Validators.maxLength(600)]}),
  });

  private readonly value = toSignal(this.form.valueChanges.pipe(startWith(this.form.getRawValue())), {initialValue: this.form.getRawValue()});

  /** Active technicians, plus the current one when editing a visit of a since-deactivated technician. */
  readonly technicianOptions = computed(() => {
    const active = this.technicians.active();
    const current = this.editing ? this.technicians.find(this.editing.technicianId) : undefined;
    return current && !current.active ? [...active, current] : active;
  });

  readonly selectedTechnician = computed(() => {
    const id = this.value().technicianId;
    return id ? this.technicians.find(Number(id)) : undefined;
  });

  /** That technician's other visits on the chosen day. */
  readonly technicianDay = computed(() => {
    const {technicianId, date} = this.value();
    return technicianId && date ? this.agenda.technicianDay(Number(technicianId), date, this.editing?.id) : [];
  });

  readonly conflicts = computed(() => {
    const {technicianId, date, time} = this.value();
    if (!technicianId || !date || !time) return [];
    return this.agenda.conflictsFor({id: this.editing?.id, technicianId: Number(technicianId), date, time});
  });

  /** "10:00, 10:30" for the warning text. */
  readonly conflictTimes = computed(() => this.conflicts().map(c => c.time).join(', '));

  readonly dayLabel = computed(() => {
    const date = this.value().date;
    return date ? longDay(date, agendaLocale(this.translate)) : '';
  });

  ngOnInit(): void {
    this.agenda.clearError();
    const v = this.editing;
    const p = this.data?.prefill ?? {};
    const source = v ?? p;
    this.form.patchValue({
      date: source.date ?? todayKey(),
      time: source.time ?? '09:00',
      technicianId: source.technicianId ?? (this.technicians.active().length === 1 ? this.technicians.active()[0].id : null),
      type: source.type ?? 'MEASUREMENT',
      title: source.title ?? '',
      customerName: source.customer?.name ?? '',
      customerPhone: source.customer?.phone ?? '',
      address: source.address ?? '',
      reference: source.reference ?? '',
      specs: source.specs ?? '',
    });
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.host.nativeElement.querySelector<HTMLElement>('.ng-invalid:not(form)')?.focus();
      return;
    }
    const v = this.form.getRawValue();
    const draft: VisitDraft = {
      date: v.date, time: v.time, technicianId: Number(v.technicianId), type: v.type, title: v.title,
      customer: {name: v.customerName, phone: v.customerPhone}, address: v.address,
      reference: v.reference, specs: v.specs,
      ...(this.data?.prefill?.quoteId ? {quoteId: this.data.prefill.quoteId} : {}),
    };
    const done = (saved: Visit) => this.ref.close(saved);
    if (this.editing) this.agenda.update(this.editing, draft, done);
    else this.agenda.create(draft, done);
  }

  cancel(): void { this.ref.close(); }
}
