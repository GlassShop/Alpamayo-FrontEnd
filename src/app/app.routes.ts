import {Routes} from '@angular/router';

const pageNotFound = () => import('./shared/presentation/views/page-not-found/page-not-found').then(m => m.PageNotFound);
const sellerShell  = () => import('./shared/presentation/components/seller-shell/seller-shell').then(m => m.SellerShell);
const dashboard    = () => import('./sellers/presentation/views/dashboard/dashboard').then(m => m.Dashboard);
const quotingNew   = () => import('./sellers/presentation/views/quoting-new/quoting-new').then(m => m.QuotingNew);
const quotesList   = () => import('./sellers/presentation/views/quotes-list/quotes-list').then(m => m.QuotesList);
const directSales  = () => import('./sellers/presentation/views/direct-sales/direct-sales').then(m => m.DirectSales);
const cashRegister = () => import('./sellers/presentation/views/cash-register/cash-register').then(m => m.CashRegister);
const orderTracking = () => import('./sellers/presentation/views/order-tracking/order-tracking').then(m => m.OrderTracking);
const agenda       = () => import('./sellers/presentation/views/agenda/agenda').then(m => m.Agenda);
const profile      = () => import('./sellers/presentation/views/profile/profile').then(m => m.Profile);

// IAM is temporarily disabled while the Sellers bounded context is built.
// const iamRoutes = () => import('./iam/presentation/iam.routes').then(m => m.iamRoutes);

const baseTitle = 'Vidrieria Alpamayo';

export const routes: Routes = [
  {
    path: 'sellers', loadComponent: sellerShell, title: `${baseTitle} - Vendedores`,
    children: [
      { path: 'dashboard',   loadComponent: dashboard },
      { path: 'quoting/new', loadComponent: quotingNew },
      { path: 'quotes',      loadComponent: quotesList },
      { path: 'sales',       loadComponent: directSales },
      { path: 'cash',        loadComponent: cashRegister },
      { path: 'orders',      loadComponent: orderTracking },
      { path: 'agenda',      loadComponent: agenda },
      { path: 'profile',     loadComponent: profile },
      { path: '',            redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  // { path: 'iam', loadChildren: iamRoutes },
  { path: '',   redirectTo: '/sellers/dashboard', pathMatch: 'full' },
  { path: '**', loadComponent: pageNotFound, title: `${baseTitle} - Página no encontrada` }
];
