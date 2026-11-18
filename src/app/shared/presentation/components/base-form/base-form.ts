import {inject} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';

/**
 * Reusable validation helpers for reactive form components.
 * Messages come from the translation files (`forms.error.*`).
 */
export class BaseForm {
  /** Named specifically so subclasses can inject their own TranslateService as `translate`. */
  private readonly formMessages = inject(TranslateService);

  /** True when the control is invalid and the user already interacted with it. */
  protected isInvalidControl(form: FormGroup, controlName: string): boolean {
    const control = form.controls[controlName];
    return control.invalid && control.touched;
  }

  /** Translated messages for every error of the control, joined by spaces. */
  protected errorMessagesForControl(form: FormGroup, controlName: string): string {
    const errors = form.controls[controlName].errors;
    if (!errors) return '';
    return Object.entries(errors).map(([key, detail]) => this.messageFor(key, detail)).join(' ');
  }

  private messageFor(errorKey: string, detail: unknown): string {
    const params = detail && typeof detail === 'object' ? detail as Record<string, unknown> : {};
    const key = `forms.error.${errorKey}`;
    const message = this.formMessages.instant(key, params);
    return message === key ? this.formMessages.instant('forms.error.invalid') : message;
  }
}
