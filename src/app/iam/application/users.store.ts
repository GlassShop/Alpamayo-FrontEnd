import {computed, inject, Injectable, signal} from '@angular/core';
import {HttpErrorResponse} from '@angular/common/http';
import {Observable} from 'rxjs';
import {NewUser, UsersApi} from '../infrastructure/users-api';
import {User} from '../domain/model/user.entity';
import {Role} from '../domain/model/role';
import {IamStore} from './iam.store';

export const MIN_PASSWORD_LENGTH = 8;

/** Why an account action was refused. Values are translation key suffixes. */
export type UsersError =
  | 'load' | 'save' | 'duplicate-username' | 'invalid-user' | 'weak-password'
  | 'self-demote' | 'self-deactivate' | 'last-ceo';

/**
 * Account administration for the CEO: create accounts with their role,
 * change roles, deactivate/reactivate and reset passwords.
 *
 * @remarks
 * The rules below keep the business from locking itself out: the CEO cannot
 * deactivate or demote their own account, and there is always at least one
 * active CEO. The server must enforce the same rules.
 */
@Injectable({providedIn: 'root'})
export class UsersStore {
  private readonly api = inject(UsersApi);
  private readonly iam = inject(IamStore);

  private readonly usersSignal = signal<User[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly savingSignal = signal(false);
  private readonly errorSignal = signal<UsersError | null>(null);
  /** Last action that succeeded, for a confirmation message. */
  private readonly noticeSignal = signal<string | null>(null);

  readonly users = computed(() =>
    [...this.usersSignal()].sort((a, b) => Number(b.active) - Number(a.active) || a.fullName.localeCompare(b.fullName))
  );
  readonly loading = this.loadingSignal.asReadonly();
  readonly saving = this.savingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly notice = this.noticeSignal.asReadonly();

  load(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.getAll().subscribe({
      next: users => { this.usersSignal.set(users); this.loadingSignal.set(false); },
      error: () => { this.errorSignal.set('load'); this.loadingSignal.set(false); }
    });
  }

  create(user: NewUser): boolean {
    const username = user.username.trim().toLowerCase();
    if (!username || !user.fullName.trim() || /\s/.test(username)) return this.fail('invalid-user');
    if (user.password.length < MIN_PASSWORD_LENGTH) return this.fail('weak-password');
    if (this.usersSignal().some(u => u.username.toLowerCase() === username)) return this.fail('duplicate-username');
    this.save(this.api.create({...user, username}), saved => {
      this.usersSignal.update(list => [...list, saved]);
      this.noticeSignal.set('created');
    });
    return true;
  }

  changeRole(user: User, role: Role): void {
    if (user.role === role) return;
    if (this.isSelf(user) && role !== 'CEO') { this.fail('self-demote'); return; }
    if (user.role === 'CEO' && user.active && this.activeCeos() <= 1) { this.fail('last-ceo'); return; }
    this.save(this.api.update(user.id, {role}), saved => { this.replace(saved); this.noticeSignal.set('role-changed'); });
  }

  setActive(user: User, active: boolean): void {
    if (user.active === active) return;
    if (!active && this.isSelf(user)) { this.fail('self-deactivate'); return; }
    if (!active && user.role === 'CEO' && this.activeCeos() <= 1) { this.fail('last-ceo'); return; }
    this.save(this.api.update(user.id, {active}), saved => {
      this.replace(saved);
      this.noticeSignal.set(active ? 'reactivated' : 'deactivated');
    });
  }

  resetPassword(user: User, password: string): boolean {
    if (password.length < MIN_PASSWORD_LENGTH) return this.fail('weak-password');
    this.save(this.api.update(user.id, {password}), saved => { this.replace(saved); this.noticeSignal.set('password-reset'); });
    return true;
  }

  isSelf(user: User): boolean {
    return this.iam.currentUser()?.id === user.id;
  }

  clearMessages(): void {
    this.errorSignal.set(null);
    this.noticeSignal.set(null);
  }

  private activeCeos(): number {
    return this.usersSignal().filter(u => u.role === 'CEO' && u.active).length;
  }

  private replace(saved: User): void {
    this.usersSignal.update(list => list.map(u => u.id === saved.id ? saved : u));
  }

  private fail(error: UsersError): false {
    this.noticeSignal.set(null);
    this.errorSignal.set(error);
    return false;
  }

  private save<T>(request$: Observable<T>, onSaved: (saved: T) => void): void {
    this.savingSignal.set(true);
    this.clearMessages();
    request$.subscribe({
      next: saved => { onSaved(saved); this.savingSignal.set(false); },
      error: (error: unknown) => {
        this.savingSignal.set(false);
        this.errorSignal.set(error instanceof HttpErrorResponse && error.status === 409 ? 'duplicate-username' : 'save');
      }
    });
  }
}
