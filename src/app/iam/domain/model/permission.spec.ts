import {Permission, roleCan} from './permission';
import {Role} from './role';

const matrix: Record<Permission, Record<Role, boolean>> = {
  'quote':               {CEO: true, SELLER: true,  WAREHOUSE: true},
  'catalog.view':        {CEO: true, SELLER: true,  WAREHOUSE: true},
  'catalog.add-product': {CEO: true, SELLER: true,  WAREHOUSE: true},
  'prices.manage':       {CEO: true, SELLER: false, WAREHOUSE: false},
  'users.manage':        {CEO: true, SELLER: false, WAREHOUSE: false},
  'quotes.view-all':     {CEO: true, SELLER: false, WAREHOUSE: false},
  'agenda':              {CEO: true, SELLER: true,  WAREHOUSE: true},
  'visits.edit-all':     {CEO: true, SELLER: false, WAREHOUSE: false},
  'technicians.manage':  {CEO: true, SELLER: false, WAREHOUSE: false},
  'inventory':           {CEO: true, SELLER: true,  WAREHOUSE: true},
  'settings':            {CEO: true, SELLER: true,  WAREHOUSE: true},
};

describe('role permissions', () => {
  for (const [permission, byRole] of Object.entries(matrix) as [Permission, Record<Role, boolean>][]) {
    for (const [role, allowed] of Object.entries(byRole) as [Role, boolean][]) {
      it(`${role} ${allowed ? 'can' : 'cannot'} ${permission}`, () => {
        expect(roleCan(role, permission)).toBe(allowed);
      });
    }
  }
});
