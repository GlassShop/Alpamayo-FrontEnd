import {BaseEntity} from '../../../shared/domain/model/base-entity';
import {Role} from './role';

/** A staff account. Passwords never reach the frontend. */
export interface User extends BaseEntity {
  username: string;
  fullName: string;
  role: Role;
  /** Inactive accounts cannot sign in; their history is kept. */
  active: boolean;
}
