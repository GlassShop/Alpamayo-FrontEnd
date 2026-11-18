import {Routes} from '@angular/router';

const pageNotFound  = () => import('./shared/presentation/views/page-not-found/page-not-found').then(m => m.PageNotFound);
const appShell      = () => import('./shared/presentation/components/seller-shell/seller-shell').then(m => m.SellerShell);
const configuration = () => import('./shared/presentation/views/configuration/configuration').then(m => m.Configuration);
const quoteBuilder  = () => import('./quoting/presentation/views/quote-builder/quote-builder').then(m => m.QuoteBuilder);
const glassCatalog  = () => import('./catalog/presentation/views/glass-catalog/glass-catalog').then(m => m.GlassCatalog);
const priceEditor   = () => import('./catalog/presentation/views/price-editor/price-editor').then(m => m.PriceEditor);
const iamRoutes     = () => import('./iam/presentation/iam.routes').then(m => m.iamRoutes);

const baseTitle = 'Vidriería Alpamayo';

/**
 * Business routes are in Spanish; code identifiers stay in English.
 *
 * TODO (IAM sprint): protect the shell with iamGuard plus a role guard
 * (CEO, vendedora, almacén) once the backend sign-in endpoint exists.
 * Routes with `data.roles` are already marked for that guard.
 */
export const routes: Routes = [
  // The root must redirect first: the IAM entry below is an empty-path
  // parent and would otherwise match "/" and render a blank page.
  { path: '', redirectTo: 'cotizador', pathMatch: 'full' },
  { path: '', loadChildren: iamRoutes },
  {
    path: '', loadComponent: appShell,
    children: [
      { path: 'cotizador',        loadComponent: quoteBuilder,  title: `${baseTitle} - Cotizador` },
      { path: 'catalogo',         loadComponent: glassCatalog,  title: `${baseTitle} - Catálogo`, pathMatch: 'full' },
      { path: 'catalogo/precios', loadComponent: priceEditor,   title: `${baseTitle} - Precios`, data: { roles: ['CEO'] } },
      { path: 'configuracion',    loadComponent: configuration, title: `${baseTitle} - Configuración` },
      { path: '',                 redirectTo: 'cotizador', pathMatch: 'full' }
    ]
  },
  { path: '**', loadComponent: pageNotFound, title: `${baseTitle} - Página no encontrada` }
];
