import {inject} from '@angular/core';
import {Router, Routes} from '@angular/router';
import {authGuard, permissionGuard} from './iam/infrastructure/iam.guard';
import {Permission} from './iam/domain/model/permission';
import {SectionLayout, SectionTab} from './shared/presentation/components/section-layout/section-layout';
import {pageTitle} from './shared/presentation/page-title';

const pageNotFound  = () => import('./shared/presentation/views/page-not-found/page-not-found').then(m => m.PageNotFound);
const appShell      = () => import('./shared/presentation/components/seller-shell/seller-shell').then(m => m.SellerShell);
const configuration = () => import('./shared/presentation/views/configuration/configuration').then(m => m.Configuration);
const quoteBuilder  = () => import('./quoting/presentation/views/quote-builder/quote-builder').then(m => m.QuoteBuilder);
const catalog       = () => import('./catalog/presentation/views/glass-catalog/glass-catalog').then(m => m.GlassCatalog);
const usersAdmin    = () => import('./iam/presentation/views/users-admin/users-admin').then(m => m.UsersAdmin);
const savedQuotes   = () => import('./quoting/presentation/views/saved-quotes/saved-quotes').then(m => m.SavedQuotes);
const quotePrint    = () => import('./quoting/presentation/views/quote-print/quote-print').then(m => m.QuotePrint);
const agenda        = () => import('./scheduling/presentation/views/agenda/agenda').then(m => m.Agenda);
const inventorySection = () => import('./purchasing/presentation/inventory-section.routes').then(m => m.inventorySectionRoutes);
const iamRoutes     = () => import('./iam/presentation/iam.routes').then(m => m.iamRoutes);

const needs = (permission: Permission) => ({permission});

/** Cotizar: the quoter and the saved quotes, one menu entry. */
const QUOTING_TABS: readonly SectionTab[] = [
  {link: '/cotizador', labelKey: 'nav.new-quote', icon: 'calculate'},
  {link: '/cotizaciones', labelKey: 'nav.quotes', icon: 'description'}
];

/** Ajustes: preferences for everyone, users for the CEO. */
const SETTINGS_TABS: readonly SectionTab[] = [
  {link: '/configuracion', labelKey: 'nav.preferences', icon: 'tune'},
  {link: '/usuarios', labelKey: 'nav.users', icon: 'group', permission: 'users.manage'}
];

/**
 * Business routes are in Spanish; code identifiers stay in English.
 *
 * Every page inside the shell requires a signed-in user (authGuard) and the
 * permission declared in `data.permission` (permissionGuard, checked against
 * the user's role). Only /iniciar-sesion is public.
 *
 * Related pages share one menu entry and show as tabs (SectionLayout);
 * their URLs did not change. Old links of merged pages redirect.
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
      { path: 'cotizaciones/:id', loadComponent: quotePrint, title: pageTitle('Cotización'), data: needs('quote') },
      {
        path: '', component: SectionLayout, data: {labelKey: 'nav.quote', tabs: QUOTING_TABS},
        children: [
          { path: 'cotizador',    loadComponent: quoteBuilder, title: pageTitle('Cotizador'),    data: needs('quote') },
          { path: 'cotizaciones', loadComponent: savedQuotes,  title: pageTitle('Cotizaciones'), data: needs('quote') }
        ]
      },
      { path: 'agenda',   loadComponent: agenda,  title: pageTitle('Agenda'),   data: needs('agenda') },
      { path: 'catalogo', loadComponent: catalog, title: pageTitle('Catálogo'), data: needs('catalog.view'), pathMatch: 'full' },
      // Prices are edited in the catalog itself (CEO only).
      { path: 'catalogo/precios', redirectTo: () => inject(Router).createUrlTree(['/catalogo'], {queryParams: {editar: 'precios'}}) },
      // Costs and purchases are part of the inventory now.
      { path: 'inventario/costos', redirectTo: '/inventario' },
      { path: 'compras', redirectTo: '/inventario/compras' },
      { path: 'inventario', loadChildren: inventorySection },
      {
        path: '', component: SectionLayout, data: {labelKey: 'nav.settings', tabs: SETTINGS_TABS},
        children: [
          { path: 'configuracion', loadComponent: configuration, title: pageTitle('Configuración'), data: needs('settings') },
          { path: 'usuarios',      loadComponent: usersAdmin,    title: pageTitle('Usuarios'),      data: needs('users.manage') }
        ]
      },
      { path: '', redirectTo: 'cotizador', pathMatch: 'full' }
    ]
  },
  { path: '**', loadComponent: pageNotFound, title: pageTitle('Página no encontrada') }
];
