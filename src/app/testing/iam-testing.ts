import {TestBed} from '@angular/core/testing';
import {HttpTestingController} from '@angular/common/http/testing';
import {environment} from '../../environments/environment';
import {IamStore} from '../iam/application/iam.store';
import {SignInCommand} from '../iam/domain/model/sign-in.command';
import {Role} from '../iam/domain/model/role';

export const SIGN_IN_URL = `${environment.apiBaseUrl}${environment.signInEndpointPath}`;

/** Sign-in API body for a user of the given role (test fixture). */
export function signInResponse(role: Role, overrides: {id?: number; active?: boolean; expiresInMs?: number} = {}) {
  return {
    token: `token-${role}`,
    expiresAt: new Date(Date.now() + (overrides.expiresInMs ?? 3_600_000)).toISOString(),
    user: {id: overrides.id ?? 1, username: role.toLowerCase(), fullName: `${role} Test`, role, active: overrides.active ?? true},
  };
}

/** Signs in through IamStore answering the HTTP call, as the real app does. */
export function signInAs(role: Role, overrides: Parameters<typeof signInResponse>[1] = {}): IamStore {
  const store = TestBed.inject(IamStore);
  const http = TestBed.inject(HttpTestingController);
  store.signIn(new SignInCommand({username: role.toLowerCase(), password: 'secret-123'}));
  http.expectOne(SIGN_IN_URL).flush(signInResponse(role, overrides));
  return store;
}
