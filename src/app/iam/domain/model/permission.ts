import {Role} from './role';

/**
 * What a user may do. Screens and actions declare the permission they need,
 * so new modules (sales, inventory…) only have to add a permission here and
 * list which roles hold it.
 */
export type Permission =
  | 'quote'               // use the glass quoter
  | 'catalog.view'        // see glass types and their prices
  | 'catalog.add-product' // add a new glass type (without price)
  | 'prices.manage'       // set prices and create price lists
  | 'users.manage'        // create accounts, change roles, reset passwords
  | 'quotes.view-all'     // see, edit and sell every seller's saved quotes
  | 'sales.cancel'        // annul a sale: the stock goes back and the quote is reopened
  | 'agenda'              // see the agenda and schedule technical visits
  | 'visits.edit-all'     // change visits scheduled by other users
  | 'technicians.manage'  // register and edit technicians
  | 'inventory'           // see stock per site, count it, adjust it, add items and register arrivals
  | 'costs.manage'        // type purchase costs (dollars, freight, transport) and see costs and margins
  | 'settings';           // interface preferences

const EVERYONE: readonly Permission[] = ['quote', 'catalog.view', 'catalog.add-product', 'agenda', 'inventory', 'settings'];

/**
 * Sellers and warehouse staff share the same permissions for now; only their
 * role tells them apart. The CEO holds every permission.
 */
export const ROLE_PERMISSIONS: Readonly<Record<Role, readonly Permission[]>> = {
  CEO: [...EVERYONE, 'prices.manage', 'users.manage', 'quotes.view-all', 'sales.cancel', 'visits.edit-all', 'technicians.manage', 'costs.manage'],
  SELLER: EVERYONE,
  WAREHOUSE: EVERYONE,
};

export function roleCan(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}
