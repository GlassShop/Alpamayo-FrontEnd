import {Component, inject, OnInit, signal} from '@angular/core';
import {AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators} from '@angular/forms';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {TranslatePipe} from '@ngx-translate/core';
import {MIN_PASSWORD_LENGTH, UsersStore} from '../../../application/users.store';
import {Role, ROLE_LABEL_KEY, ROLES} from '../../../domain/model/role';
import {User} from '../../../domain/model/user.entity';
import {BaseForm} from '../../../../shared/presentation/components/base-form/base-form';

/** Both password fields of a form must match. */
function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirm')?.value;
  return password && confirm && password !== confirm ? {mismatch: true} : null;
}

/**
 * CEO screen to manage staff accounts: create them with a role and an
 * initial password (to hand over to the person), change roles,
 * deactivate/reactivate and reset forgotten passwords.
 */
@Component({
  selector: 'app-users-admin',
  imports: [ReactiveFormsModule, TranslatePipe, MatIconModule, MatTooltipModule],
  templateUrl: './users-admin.html',
  styleUrl: './users-admin.css'
})
export class UsersAdmin extends BaseForm implements OnInit {
  readonly store = inject(UsersStore);
  readonly roles = ROLES;
  readonly roleLabel = ROLE_LABEL_KEY;
  readonly minLength = MIN_PASSWORD_LENGTH;

  /** Account whose password is being reset, if any. */
  readonly resetting = signal<User | null>(null);

  readonly createForm = new FormGroup({
    fullName: new FormControl('', {nonNullable: true, validators: [Validators.required, Validators.maxLength(80)]}),
    username: new FormControl('', {nonNullable: true, validators: [
      Validators.required, Validators.maxLength(30), Validators.pattern(/^[a-zA-Z0-9._-]+$/)
    ]}),
    role: new FormControl<Role>('SELLER', {nonNullable: true}),
    password: new FormControl('', {nonNullable: true, validators: [Validators.required, Validators.minLength(MIN_PASSWORD_LENGTH)]}),
    confirm: new FormControl('', {nonNullable: true, validators: [Validators.required]}),
  }, {validators: passwordsMatch});

  readonly resetForm = new FormGroup({
    password: new FormControl('', {nonNullable: true, validators: [Validators.required, Validators.minLength(MIN_PASSWORD_LENGTH)]}),
    confirm: new FormControl('', {nonNullable: true, validators: [Validators.required]}),
  }, {validators: passwordsMatch});

  ngOnInit(): void {
    this.store.clearMessages();
    this.store.load();
  }

  createUser(): void {
    if (this.createForm.invalid) { this.createForm.markAllAsTouched(); return; }
    const {fullName, username, role, password} = this.createForm.getRawValue();
    if (this.store.create({fullName, username, role, password})) this.createForm.reset({role: 'SELLER'});
  }

  onRole(user: User, event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.store.changeRole(user, select.value as Role);
    select.value = user.role; // the table re-renders with the saved role
  }

  startReset(user: User): void {
    this.store.clearMessages();
    this.resetForm.reset();
    this.resetting.set(user);
  }

  confirmReset(): void {
    const user = this.resetting();
    if (!user) return;
    if (this.resetForm.invalid) { this.resetForm.markAllAsTouched(); return; }
    if (this.store.resetPassword(user, this.resetForm.getRawValue().password)) this.resetting.set(null);
  }
}
