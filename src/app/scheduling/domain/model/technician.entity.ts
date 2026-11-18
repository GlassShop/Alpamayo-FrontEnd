import {BaseEntity} from '../../../shared/domain/model/base-entity';

/**
 * Field technician. Technicians do not use the app: the CEO registers them
 * and sellers assign them to visits (details are sent by WhatsApp).
 */
export interface Technician extends BaseEntity {
  name: string;
  phone: string;
  /** Hex colour used for their visits on the calendar. */
  color: string;
  /** Inactive technicians keep their past visits but cannot get new ones. */
  active: boolean;
}

/** Calendar colours offered to the CEO (readable with white text, distinct from each other). */
export const TECHNICIAN_COLORS: readonly string[] = [
  '#2563eb', '#16a34a', '#d97706', '#9333ea', '#0891b2', '#db2777', '#4b5a70', '#b91c1c',
];
