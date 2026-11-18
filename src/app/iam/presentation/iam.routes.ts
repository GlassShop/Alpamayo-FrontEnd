import {Routes} from '@angular/router';

const signInForm = () => import('./views/sign-in-form/sign-in-form').then(m => m.SignInForm);

/**
 * Route tree for IAM presentation views.
 */
export const iamRoutes: Routes = [
  { path: 'iniciar-sesion', loadComponent: signInForm, title: 'Vidriería Alpamayo - Iniciar sesión' }
];
