import {Component, inject} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {MatIconModule} from '@angular/material/icon';
import {TranslatePipe} from '@ngx-translate/core';
import {IamStore} from '../../../application/iam.store';
import {SignInCommand} from '../../../domain/model/sign-in.command';
import {BaseForm} from '../../../../shared/presentation/components/base-form/base-form';

/**
 * Sign-in page. Accounts are created by the CEO, so there is no sign-up link.
 * After signing in, the user returns to the page they asked for (`?volver=`).
 */
@Component({
  selector: 'app-sign-in-form',
  imports: [ReactiveFormsModule, TranslatePipe, MatIconModule],
  templateUrl: './sign-in-form.html',
  styleUrl: './sign-in-form.css'
})
export class SignInForm extends BaseForm {
  readonly store = inject(IamStore);
  private readonly route = inject(ActivatedRoute);
  showPassword = false;

  readonly form = new FormGroup({
    username: new FormControl('', {nonNullable: true, validators: [Validators.required]}),
    password: new FormControl('', {nonNullable: true, validators: [Validators.required]})
  });

  performSignIn(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const {username, password} = this.form.getRawValue();
    this.store.signIn(new SignInCommand({username, password}), this.route.snapshot.queryParamMap.get('volver'));
  }
}
