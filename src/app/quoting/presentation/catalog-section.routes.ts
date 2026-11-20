import {Routes} from '@angular/router';
import {pageTitle} from '../../shared/presentation/page-title';
import {QUOTE_CART} from '../../catalog/application/quote-cart';
import {QuoteCartAdapter} from './quote-cart.adapter';

const catalog = () => import('../../catalog/presentation/views/glass-catalog/glass-catalog').then(m => m.GlassCatalog);

/**
 * The Catálogo menu entry. Quoting composes it because the catalog sells:
 * its products go into the quote being built. The catalog itself does not
 * depend on quoting.
 */
export const catalogSectionRoutes: Routes = [{
  path: '', pathMatch: 'full', loadComponent: catalog, title: pageTitle('Catálogo'), data: {permission: 'catalog.view'},
  providers: [{provide: QUOTE_CART, useClass: QuoteCartAdapter}]
}];
