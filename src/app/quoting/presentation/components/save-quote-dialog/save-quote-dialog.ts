import {Component, computed, effect, ElementRef, inject, OnInit, signal} from '@angular/core';
import {DecimalPipe} from '@angular/common';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {toSignal} from '@angular/core/rxjs-interop';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {TranslatePipe} from '@ngx-translate/core';
import {QuotingStore} from '../../../application/quoting.store';
import {SavedQuotesStore} from '../../../application/saved-quotes.store';
import {CustomerLookupStore} from '../../../application/customer-lookup.store';
import {IamStore} from '../../../../iam/application/iam.store';
import {cleanDocNumber, docTypeOf, isValidDocument} from '../../../domain/model/document-id';
import {PAYMENT_METHODS, PaymentMethod} from '../../../domain/model/payment-method';
import {QuoteDetails, SavedQuote} from '../../../domain/model/saved-quote.entity';
import {COMPANY_PROFILE} from '../../../../shared/domain/model/company-profile';
import {roundMoney} from '../../../domain/services/square-foot-calculator';
import {BaseForm} from '../../../../shared/presentation/components/base-form/base-form';

export interface SaveQuoteDialogData {
  /** Details of the quote being edited, to pre-fill the form. */
  initial?: QuoteDetails;
}

/**
 * Modal to save the current quote: customer (looked up by DNI/RUC, or typed
 * by hand when not found), payment method, advance and the sale conditions
 * accepted by the customer. Closes with the saved quote.
 */
@Component({
  selector: 'app-save-quote-dialog',
  imports: [DecimalPipe, ReactiveFormsModule, TranslatePipe, MatIconModule],
  templateUrl: './save-quote-dialog.html',
  styleUrl: './save-quote-dialog.css'
})
export class SaveQuoteDialog extends BaseForm implements OnInit {
  readonly quoting = inject(QuotingStore);
  readonly savedQuotes = inject(SavedQuotesStore);
  readonly lookup = inject(CustomerLookupStore);
  readonly iam = inject(IamStore);
  private readonly ref = inject(MatDialogRef<SaveQuoteDialog, SavedQuote>);
  private readonly data = inject<SaveQuoteDialogData | null>(MAT_DIALOG_DATA, {optional: true});
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly paymentMethods = PAYMENT_METHODS;
  readonly conditions = COMPANY_PROFILE.saleConditions;

  readonly form = new FormGroup({
    docNumber: new FormControl('', {nonNullable: true, validators: [Validators.required]}),
    name: new FormControl('', {nonNullable: true, validators: [Validators.required, Validators.maxLength(120)]}),
    phone: new FormControl('', {nonNullable: true, validators: [Validators.pattern(/^\+?[\d\s-]{6,15}$/)]}),
    address: new FormControl('', {nonNullable: true, validators: [Validators.maxLength(160)]}),
    paymentMethod: new FormControl<PaymentMethod | ''>('', {nonNullable: true, validators: [Validators.required]}),
    advance: new FormControl<number>(0, {nonNullable: true, validators: [Validators.required, Validators.min(0)]}),
    notes: new FormControl('', {nonNullable: true, validators: [Validators.maxLength(300)]}),
    termsAccepted: new FormControl(false, {nonNullable: true, validators: [Validators.requiredTrue]}),
  });

  private readonly docValue = toSignal(this.form.controls.docNumber.valueChanges, {initialValue: ''});
  private readonly advanceValue = toSignal(this.form.controls.advance.valueChanges, {initialValue: 0});

  readonly docNumber = computed(() => cleanDocNumber(this.docValue()));
  readonly docType = computed(() => docTypeOf(this.docNumber()));
  readonly docValid = computed(() => {
    const type = this.docType();
    return !!type && isValidDocument(type, this.docNumber());
  });
  /** Manual entry is offered when the lookup did not find the document or failed. */
  readonly manual = computed(() => ['not-found', 'error'].includes(this.lookup.status()));
  readonly balance = computed(() => roundMoney(this.quoting.total() - (Number(this.advanceValue()) || 0)));
  readonly advanceTooHigh = computed(() => (Number(this.advanceValue()) || 0) > this.quoting.total());
  readonly submitted = signal(false);
  private autoFilledName = '';

  constructor() {
    super();
    // Look up as soon as the number is a valid DNI or RUC.
    effect(() => {
      const type = this.docType();
      const number = this.docNumber();
      if (type && this.docValid()) this.lookup.lookup(type, number);
      else this.lookup.reset();
    });
    // Fill the customer data when found (phone/address only if still empty).
    effect(() => {
      const holder = this.lookup.holder();
      if (!holder) return;
      const c = this.form.controls;
      c.name.setValue(holder.name);
      this.autoFilledName = holder.name;
      if (holder.address && !c.address.value) c.address.setValue(holder.address);
      if (holder.phone && !c.phone.value) c.phone.setValue(holder.phone);
    });
    // A name filled for a previous document must not stay when the new one is not found.
    effect(() => {
      if (this.lookup.status() === 'not-found' && this.form.controls.name.value === this.autoFilledName) {
        this.form.controls.name.setValue('');
      }
    });
  }

  ngOnInit(): void {
    this.savedQuotes.clearError();
    const initial = this.data?.initial;
    if (initial) {
      this.form.patchValue({
        docNumber: initial.customer.docNumber, name: initial.customer.name,
        phone: initial.customer.phone ?? '', address: initial.customer.address ?? '',
        paymentMethod: initial.paymentMethod, advance: initial.advance,
        notes: initial.notes ?? '', termsAccepted: initial.termsAccepted,
      });
    }
  }

  save(): void {
    this.submitted.set(true);
    this.form.markAllAsTouched();
    const type = this.docType();
    if (this.form.invalid || !type || !this.docValid() || this.advanceTooHigh()) {
      this.focusFirstProblem();
      return;
    }
    const v = this.form.getRawValue();
    const details: QuoteDetails = {
      customer: {
        docType: type, docNumber: this.docNumber(), name: v.name.trim(),
        ...(v.phone.trim() ? {phone: v.phone.trim()} : {}),
        ...(v.address.trim() ? {address: v.address.trim()} : {}),
      },
      paymentMethod: v.paymentMethod as PaymentMethod,
      advance: roundMoney(Number(v.advance) || 0),
      termsAccepted: v.termsAccepted,
      ...(v.notes.trim() ? {notes: v.notes.trim()} : {}),
    };
    const editingId = this.quoting.editing()?.id ?? null;
    this.savedQuotes.save(this.quoting.toSnapshot(details), editingId, saved => {
      this.quoting.markSaved(saved);
      this.ref.close(saved);
    });
  }

  cancel(): void { this.ref.close(); }

  /** Moves focus (and scroll) to the first field that stops the quote from being saved. */
  private focusFirstProblem(): void {
    const ids = [
      ['sq-doc', !this.docValid()], ['sq-name', this.form.controls.name.invalid],
      ['sq-phone', this.form.controls.phone.invalid], ['sq-method', this.form.controls.paymentMethod.invalid],
      ['sq-advance', this.form.controls.advance.invalid || this.advanceTooHigh()],
      ['sq-terms', this.form.controls.termsAccepted.invalid],
    ] as const;
    const id = ids.find(([, bad]) => bad)?.[0];
    this.host.nativeElement.querySelector<HTMLElement>(`#${id}`)?.focus();
  }
}
