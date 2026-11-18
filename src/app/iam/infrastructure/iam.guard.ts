import {inject} from '@angular/core';
import {CanActivateChildFn, CanActivateFn, Router} from '@angular/router';
import {HOME_PATH, IamStore, SIGN_IN_PATH} from '../application/iam.store';
import {Permission} from '../domain/model/permission';

/**
 * Requires a valid session. Otherwise sends the user to the sign-in page and
 * remembers the requested URL in `?volver=` to come back after signing in.
 *
 * @example
 * { path: '', component: Shell, canActivate: [authGuard], canActivateChild: [permissionGuard], children: [...] }
 */
export const authGuard: CanActivateFn = (_route, state) => {
  if (inject(IamStore).hasValidSession()) return true;
  return inject(Router).createUrlTree([SIGN_IN_PATH], {queryParams: {volver: state.url}});
};

/**
 * Checks the permission declared in the route's `data.permission`.
 * Routes without a permission are allowed to any signed-in user.
 * A user without the permission is sent to the quoter, which every role can use.
 */
export const permissionGuard: CanActivateChildFn = (childRoute, state) => {
  const store = inject(IamStore);
  const router = inject(Router);
  if (!store.hasValidSession()) return router.createUrlTree([SIGN_IN_PATH], {queryParams: {volver: state.url}});
  const permission = childRoute.data?.['permission'] as Permission | undefined;
  return !permission || store.can(permission) ? true : router.createUrlTree([HOME_PATH]);
};

/** Keeps signed-in users away from the sign-in page. */
export const guestGuard: CanActivateFn = () => {
  return inject(IamStore).hasValidSession() ? inject(Router).createUrlTree([HOME_PATH]) : true;
};
