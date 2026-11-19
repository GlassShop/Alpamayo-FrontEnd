import {ProductCategory} from '../domain/model/product.entity';
import {TabOption} from '../../shared/presentation/components/tab-bar/tab-bar';

/** Glass, or one of the categories of the other sale products. */
export type CatalogTab = 'GLASS' | ProductCategory;

/** Tabs of the catalog and the prices page, in the order the shop thinks of them. */
export function catalogTabs(badge: (tab: CatalogTab) => number | null): TabOption<CatalogTab>[] {
  return ([
    ['GLASS', 'window'], ['ALUMINUM_SERIES', 'view_week'], ['ALUMINUM_TRADITIONAL', 'straighten'],
    ['ACCESSORY', 'hardware'], ['OTHER', 'layers'],
  ] as const).map(([id, icon]) => ({id, icon, labelKey: `catalog.tabs.${id}`, badge: badge(id)}));
}
