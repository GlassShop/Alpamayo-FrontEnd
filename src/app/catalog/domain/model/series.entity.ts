import {BaseEntity} from '../../../shared/domain/model/base-entity';

/** Aluminium system sold by series, e.g. "Serie 80" (sliding windows) or "Serie 42" (projecting windows). */
export interface Series extends BaseEntity {
  name: string;
}
