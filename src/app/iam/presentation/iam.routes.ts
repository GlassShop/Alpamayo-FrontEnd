import {Routes} from '@angular/router';
import {guestGuard} from '../infrastructure/iam.guard';

const signInForm = () => import('./views/sign-in-form/sign-in-form').then(m => m.SignInForm);

/**
 * Public IAM routes. Signed-in users are sent to the quoter.
 */
export const iamRoutes: Routes = [
  { path: 'iniciar-sesion', loadComponent: signInForm, canActivate: [guestGuard], title: 'Vidriería Alpamayo - Iniciar sesión' }
];
