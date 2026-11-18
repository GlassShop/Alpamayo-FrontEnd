import {Routes} from '@angular/router';
import {authGuard, permissionGuard} from './iam/infrastructure/iam.guard';
import {Permission} from './iam/domain/model/permission';

const pageNotFound  = () => import('./shared/presentation/views/page-not-found/page-not-found').then(m => m.PageNotFound);
const appShell      = () => import('./shared/presentation/components/seller-shell/seller-shell').then(m => m.SellerShell);
const configuration = () => import('./shared/presentation/views/configuration/configuration').then(m => m.Configuration);
const quoteBuilder  = () => import('./quoting/presentation/views/quote-builder/quote-builder').then(m => m.QuoteBuilder);
const glassCatalog  = () => import('./catalog/presentation/views/glass-catalog/glass-catalog').then(m => m.GlassCatalog);
const priceEditor   = () => import('./catalog/presentation/views/price-editor/price-editor').then(m => m.PriceEditor);
const usersAdmin    = () => import('./iam/presentation/views/users-admin/users-admin').then(m => m.UsersAdmin);
const savedQuotes   = () => import('./quoting/presentation/views/saved-quotes/saved-quotes').then(m => m.SavedQuotes);
const quotePrint    = () => import('./quoting/presentation/views/quote-print/quote-print').then(m => m.QuotePrint);
const iamRoutes     = () => import('./iam/presentation/iam.routes').then(m => m.iamRoutes);

const baseTitle = 'Vidriería Alpamayo';
const needs = (permission: Permission) => ({permission});

/**
 * Business routes are in Spanish; code identifiers stay in English.
 *
 * Every page inside the shell requires a signed-in user (authGuard) and the
 * permission declared in `data.permission` (permissionGuard, checked against
 * the user's role). Only /iniciar-sesion is public.
 */
export const routes: Routes = [
  // The root must redirect first: the IAM entry below is an empty-path
  // parent and would otherwise match "/" and render a blank page.
  { path: '', redirectTo: 'cotizador', pathMatch: 'full' },
  { path: '', loadChildren: iamRoutes },
  {
    path: '', loadComponent: appShell,
    canActivate: [authGuard],
    canActivateChild: [permissionGuard],
    children: [
      { path: 'cotizador',        loadComponent: quoteBuilder,  title: `${baseTitle} - Cotizador`,     data: needs('quote') },
      { path: 'cotizaciones',     loadComponent: savedQuotes,   title: `${baseTitle} - Cotizaciones`,  data: needs('quote') },
      { path: 'cotizaciones/:id', loadComponent: quotePrint,    title: `${baseTitle} - Cotización`,    data: needs('quote') },
      { path: 'catalogo',         loadComponent: glassCatalog,  title: `${baseTitle} - Catálogo`,      data: needs('catalog.view'), pathMatch: 'full' },
      { path: 'catalogo/precios', loadComponent: priceEditor,   title: `${baseTitle} - Precios`,       data: needs('prices.manage') },
      { path: 'usuarios',         loadComponent: usersAdmin,    title: `${baseTitle} - Usuarios`,      data: needs('users.manage') },
      { path: 'configuracion',    loadComponent: configuration, title: `${baseTitle} - Configuración`, data: needs('settings') },
      { path: '',                 redirectTo: 'cotizador', pathMatch: 'full' }
    ]
  },
  { path: '**', loadComponent: pageNotFound, title: `${baseTitle} - Página no encontrada` }
];
