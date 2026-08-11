import {Routes} from '@angular/router';

const pageNotFound  = () => import('./shared/presentation/views/page-not-found/page-not-found').then(m => m.PageNotFound);
const sellerShell   = () => import('./shared/presentation/components/seller-shell/seller-shell').then(m => m.SellerShell);
const dashboard     = () => import('./sellers/presentation/views/dashboard/dashboard').then(m => m.Dashboard);
const quotingNew    = () => import('./sellers/presentation/views/quoting-new/quoting-new').then(m => m.QuotingNew);
const directSales   = () => import('./sellers/presentation/views/direct-sales/direct-sales').then(m => m.DirectSales);
const cashRegister  = () => import('./sellers/presentation/views/cash-register/cash-register').then(m => m.CashRegister);
const orderTracking = () => import('./sellers/presentation/views/order-tracking/order-tracking').then(m => m.OrderTracking);
const agenda        = () => import('./sellers/presentation/views/agenda/agenda').then(m => m.Agenda);
const profile       = () => import('./sellers/presentation/views/profile/profile').then(m => m.Profile);

// Sales BC sub-routes
const salesShell    = () => import('./sales/presentation/views/sales-shell/sales-shell').then(m => m.SalesShell);
const salesProducts = () => import('./sales/presentation/views/direct-sales/direct-sales').then(m => m.DirectSales);
const salesCotizaciones    = () => import('./sales/presentation/views/cotizaciones/cotizaciones').then(m => m.Cotizaciones);
const salesAdelantos       = () => import('./sales/presentation/views/adelantos/adelantos').then(m => m.Adelantos);
const salesContractViewer  = () => import('./sales/presentation/views/digital-contract-viewer/digital-contract-viewer').then(m => m.DigitalContractViewer);

// Workshop BC sub-routes
const workshopShell   = () => import('./workshop/presentation/views/workshop-shell/workshop-shell').then(m => m.WorkshopShell);
const estadoTaller    = () => import('./workshop/presentation/views/estado-taller/estado-taller').then(m => m.EstadoTaller);
const sprintProyectos = () => import('./workshop/presentation/views/sprint-proyectos/sprint-proyectos').then(m => m.SprintProyectos);

// IAM is temporarily disabled while the Sellers bounded context is built.
// const iamRoutes = () => import('./iam/presentation/iam.routes').then(m => m.iamRoutes);

const baseTitle = 'Vidrieria Alpamayo';

export const routes: Routes = [
  {
    path: 'sellers', loadComponent: sellerShell, title: `${baseTitle} - Vendedores`,
    children: [
      { path: 'dashboard',   loadComponent: dashboard },
      { path: 'quoting/new', loadComponent: quotingNew },
      {
        path: 'quotes', loadComponent: salesShell,
        children: [
          { path: 'productos',     loadComponent: salesProducts },
          { path: 'cotizaciones',  loadComponent: salesCotizaciones },
          { path: 'adelantos',     loadComponent: salesAdelantos },
          { path: 'contrato',      loadComponent: salesContractViewer },
          { path: '',              redirectTo: 'productos', pathMatch: 'full' }
        ]
      },
      { path: 'sales',       loadComponent: directSales },
      { path: 'cash',        loadComponent: cashRegister },
      {
        path: 'workshop', loadComponent: workshopShell,
        children: [
          { path: 'estado-taller', loadComponent: estadoTaller },
          { path: 'sprint',        loadComponent: sprintProyectos },
          { path: '',              redirectTo: 'estado-taller', pathMatch: 'full' }
        ]
      },
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
