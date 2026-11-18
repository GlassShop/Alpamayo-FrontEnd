import {Component, inject, OnInit, signal} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatDialogRef} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {TranslatePipe} from '@ngx-translate/core';
import {TechniciansStore} from '../../../application/technicians.store';
import {Technician, TECHNICIAN_COLORS} from '../../../domain/model/technician.entity';
import {BaseForm} from '../../../../shared/presentation/components/base-form/base-form';

/** CEO: register technicians (name, phone, calendar colour) and activate/deactivate them. */
@Component({
  selector: 'app-technicians-dialog',
  imports: [ReactiveFormsModule, TranslatePipe, MatIconModule],
  templateUrl: './technicians-dialog.html',
  styleUrl: './technicians-dialog.css'
})
export class TechniciansDialog extends BaseForm implements OnInit {
  readonly store = inject(TechniciansStore);
  private readonly ref = inject(MatDialogRef<TechniciansDialog>);
  readonly colors = TECHNICIAN_COLORS;
  /** Technician whose phone is being edited inline. */
  readonly editingPhone = signal<number | null>(null);

  readonly form = new FormGroup({
    name: new FormControl('', {nonNullable: true, validators: [Validators.required, Validators.maxLength(60)]}),
    phone: new FormControl('', {nonNullable: true, validators: [Validators.required, Validators.pattern(/^\+?[\d\s-]{6,15}$/)]}),
    color: new FormControl(TECHNICIAN_COLORS[0], {nonNullable: true}),
  });

  ngOnInit(): void {
    this.store.clearError();
    this.form.patchValue({color: this.store.nextColor()});
  }

  add(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const {name, phone, color} = this.form.getRawValue();
    this.store.create(name, phone, color, () => this.form.reset({name: '', phone: '', color: this.store.nextColor()}));
  }

  setColor(t: Technician, color: string): void { if (t.color !== color) this.store.update(t, {color}); }

  savePhone(t: Technician, event: Event): void {
    const phone = (event.target as HTMLInputElement).value.trim();
    this.editingPhone.set(null);
    if (phone && phone !== t.phone && /^\+?[\d\s-]{6,15}$/.test(phone)) this.store.update(t, {phone});
  }

  close(): void { this.ref.close(); }
}
