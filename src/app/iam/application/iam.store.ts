import {computed, inject, Injectable, signal} from '@angular/core';
import {Router} from '@angular/router';
import {IamApi} from '../infrastructure/iam-api';
import {SignInError, SignInFailure} from '../infrastructure/sign-in-api-endpoint';
import {SignInCommand} from '../domain/model/sign-in.command';
import {isSessionValid, Session} from '../domain/model/session';
import {Permission, roleCan} from '../domain/model/permission';
import {isRole} from '../domain/model/role';
import {User} from '../domain/model/user.entity';

const SESSION_KEY = 'alpamayo.session';
export const SIGN_IN_PATH = '/iniciar-sesion';
export const HOME_PATH = '/cotizador';

/**
 * Authentication state of the current browser.
 *
 * @remarks
 * - The session is kept in localStorage so it survives a reload, and it ends
 *   on sign-out or when it expires (at most one 8-hour shift).
 * - Permissions are derived from the user's role (see ROLE_PERMISSIONS).
 * - Nothing about the password is ever stored or logged.
 */
@Injectable({providedIn: 'root'})
export class IamStore {
  private readonly api = inject(IamApi);
  private readonly router = inject(Router);

  private readonly sessionSignal = signal<Session | null>(null);
  private readonly signingInSignal = signal(false);
  private readonly signInErrorSignal = signal<SignInFailure | null>(null);
  private expiryTimer: ReturnType<typeof setTimeout> | undefined;

  readonly currentUser = computed<User | null>(() => this.sessionSignal()?.user ?? null);
  readonly isSignedIn = computed(() => this.sessionSignal() !== null);
  readonly currentToken = computed(() => this.sessionSignal()?.token ?? null);
  /** Display name of the signed-in user, or null. */
  readonly currentUsername = computed(() => this.currentUser()?.fullName ?? null);
  readonly signingIn = this.signingInSignal.asReadonly();
  /** Translation key suffix of the last sign-in failure. */
  readonly signInError = this.signInErrorSignal.asReadonly();

  constructor() {
    this.setSession(readStoredSession());
  }

  /** True when the signed-in user's role holds the permission. */
  can(permission: Permission): boolean {
    const user = this.currentUser();
    return !!user && roleCan(user.role, permission);
  }

  /** Re-checks the expiry (e.g. after the laptop slept) and drops a stale session. */
  hasValidSession(): boolean {
    if (isSessionValid(this.sessionSignal())) return true;
    if (this.sessionSignal()) this.setSession(null);
    return false;
  }

  signIn(command: SignInCommand, returnUrl?: string | null): void {
    this.signingInSignal.set(true);
    this.signInErrorSignal.set(null);
    this.api.signIn(command).subscribe({
      next: session => {
        this.setSession(session);
        this.signingInSignal.set(false);
        this.router.navigateByUrl(safeReturnUrl(returnUrl)).then();
      },
      error: (error: unknown) => {
        this.setSession(null);
        this.signingInSignal.set(false);
        this.signInErrorSignal.set(error instanceof SignInError ? error.reason : 'unavailable');
      }
    });
  }

  /** Ends the session and goes to the sign-in page, remembering where the user was. */
  signOut(returnUrl?: string): void {
    this.setSession(null);
    this.signInErrorSignal.set(null);
    const queryParams = returnUrl && returnUrl !== SIGN_IN_PATH ? {volver: returnUrl} : undefined;
    this.router.navigate([SIGN_IN_PATH], {queryParams}).then();
  }

  clearSignInError(): void { this.signInErrorSignal.set(null); }

  private setSession(session: Session | null): void {
    clearTimeout(this.expiryTimer);
    const valid = isSessionValid(session) ? session : null;
    this.sessionSignal.set(valid);
    writeStoredSession(valid);
    if (valid) {
      // Sign out automatically when the shift ends, even if the page stays open.
      this.expiryTimer = setTimeout(() => this.signOut(this.router.url), Math.max(0, valid.expiresAt - Date.now()));
    }
  }
}

/** Only internal paths are allowed as return URLs (no open redirects). */
export function safeReturnUrl(url: string | null | undefined): string {
  return url && url.startsWith('/') && !url.startsWith('//') && !url.startsWith(SIGN_IN_PATH) ? url : HOME_PATH;
}

function readStoredSession(): Session | null {
  try {
    const raw = globalThis.localStorage?.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    const user = parsed?.user;
    const wellFormed = typeof parsed?.token === 'string' && typeof parsed?.expiresAt === 'number'
      && typeof user?.id === 'number' && typeof user?.username === 'string' && isRole(user?.role);
    return wellFormed ? parsed : null;
  } catch {
    return null;
  }
}

function writeStoredSession(session: Session | null): void {
  try {
    if (session) globalThis.localStorage?.setItem(SESSION_KEY, JSON.stringify(session));
    else globalThis.localStorage?.removeItem(SESSION_KEY);
  } catch { /* storage unavailable: the session lives only in memory */ }
}
