import {HttpErrorResponse, HttpInterceptorFn} from '@angular/common/http';
import {inject} from '@angular/core';
import {Router} from '@angular/router';
import {catchError, throwError} from 'rxjs';
import {environment} from '../../../environments/environment';
import {IamStore} from '../application/iam.store';

/**
 * Adds the session token to API requests and ends the session when the API
 * answers 401 (expired or revoked token), sending the user to sign in again.
 *
 * @remarks
 * The token is only sent to the configured API, never to third-party URLs
 * (fonts, translations…). The sign-in request itself is left untouched so a
 * wrong password does not trigger a sign-out loop.
 */
export const iamInterceptor: HttpInterceptorFn = (request, next) => {
  const store = inject(IamStore);
  const router = inject(Router);
  const isApi = request.url.startsWith(environment.apiBaseUrl);
  const isSignIn = request.url.endsWith(environment.signInEndpointPath);
  const token = store.currentToken();

  const handled = isApi && token && !isSignIn
    ? request.clone({setHeaders: {Authorization: `Bearer ${token}`}})
    : request;

  return next(handled).pipe(
    catchError((error: unknown) => {
      if (isApi && !isSignIn && error instanceof HttpErrorResponse && error.status === 401 && store.isSignedIn()) {
        store.signOut(router.url);
      }
      return throwError(() => error);
    })
  );
};
