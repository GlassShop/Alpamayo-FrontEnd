import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {catchError, map, Observable, throwError} from 'rxjs';
import {environment} from '../../../environments/environment';
import {SignInCommand} from '../domain/model/sign-in.command';
import {Session} from '../domain/model/session';
import {SignInAssembler} from './sign-in-assembler';
import {SignInResponse} from './sign-in-response';

/** Why a sign-in failed. Values are translation key suffixes. */
export type SignInFailure = 'invalid-credentials' | 'inactive' | 'unavailable';

export class SignInError extends Error {
  constructor(readonly reason: SignInFailure) { super(reason); }
}

const signInUrl = `${environment.apiBaseUrl}${environment.signInEndpointPath}`;

/**
 * POST /authentication/sign-in
 * - 200 → session
 * - 401 → wrong username or password
 * - 403 → account deactivated by the CEO
 * - anything else → server unavailable
 */
export class SignInApiEndpoint {
  constructor(private http: HttpClient, private assembler: SignInAssembler) {}

  signIn(command: SignInCommand): Observable<Session> {
    return this.http.post<SignInResponse>(signInUrl, this.assembler.toRequestFromCommand(command)).pipe(
      map(response => this.assembler.toSessionFromResponse(response)),
      catchError((error: unknown) => throwError(() => new SignInError(failureOf(error))))
    );
  }
}

function failureOf(error: unknown): SignInFailure {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 401) return 'invalid-credentials';
    if (error.status === 403) return 'inactive';
  }
  return 'unavailable';
}
