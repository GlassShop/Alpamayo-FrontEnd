import {BaseEntity} from '../../../shared/domain/model/base-entity';

/** A named price list created by the CEO, e.g. "Pública", "Vidriero". */
export interface PriceList extends BaseEntity {
  name: string;
}
