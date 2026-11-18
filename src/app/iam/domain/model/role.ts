/** Roles of Vidriería Alpamayo staff. Accounts are created only by the CEO. */
export type Role = 'CEO' | 'SELLER' | 'WAREHOUSE';

export const ROLES: readonly Role[] = ['CEO', 'SELLER', 'WAREHOUSE'];

/** Translation key of each role's display name. */
export const ROLE_LABEL_KEY: Readonly<Record<Role, string>> = {
  CEO: 'iam.role.CEO',
  SELLER: 'iam.role.SELLER',
  WAREHOUSE: 'iam.role.WAREHOUSE',
};

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}
