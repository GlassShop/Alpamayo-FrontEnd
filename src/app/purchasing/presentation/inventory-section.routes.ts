import {computed, inject} from '@angular/core';
import {Routes} from '@angular/router';
import {SECTION_BADGES, SectionLayout, SectionTab} from '../../shared/presentation/components/section-layout/section-layout';
import {pageTitle} from '../../shared/presentation/page-title';
import {INVENTORY_COSTS} from '../../inventory/application/inventory-costs';
import {IamStore} from '../../iam/application/iam.store';
import {PurchasesStore} from '../application/purchases.store';
import {InventoryCostsAdapter} from './inventory-costs.adapter';

const inventory = () => import('../../inventory/presentation/views/inventory/inventory').then(m => m.Inventory);
const purchases = () => import('./views/purchases/purchases').then(m => m.Purchases);

export const PURCHASES_TAB_LINK = '/inventario/compras';

const TABS: readonly SectionTab[] = [
  {link: '/inventario', labelKey: 'nav.stock', icon: 'inventory_2'},
  {link: PURCHASES_TAB_LINK, labelKey: 'nav.purchases', icon: 'local_shipping'}
];

/** The CEO sees on the Compras tab how many purchases wait for their costs. */
function pendingCostsBadge() {
  const iam = inject(IamStore);
  const store = inject(PurchasesStore);
  if (iam.can('costs.manage')) store.ensureLoaded();
  return {[PURCHASES_TAB_LINK]: computed(() => (iam.can('costs.manage') ? store.pendingCount() || null : null))};
}

/**
 * The Inventario menu entry: stock and purchases as tabs of one section.
 * Purchasing composes it because it gives the stock table its costs; the
 * inventory itself does not depend on purchasing.
 */
export const inventorySectionRoutes: Routes = [{
  path: '',
  component: SectionLayout,
  data: {labelKey: 'nav.inventory', tabs: TABS},
  providers: [
    {provide: INVENTORY_COSTS, useClass: InventoryCostsAdapter},
    {provide: SECTION_BADGES, useFactory: pendingCostsBadge}
  ],
  children: [
    {path: '', pathMatch: 'full', loadComponent: inventory, title: pageTitle('Inventario'), data: {permission: 'inventory'}},
    {path: 'compras', loadComponent: purchases, title: pageTitle('Compras'), data: {permission: 'inventory'}}
  ]
}];
