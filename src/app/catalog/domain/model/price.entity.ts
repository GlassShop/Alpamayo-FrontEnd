import {BaseEntity} from '../../../shared/domain/model/base-entity';

/** Price per square foot (IGV included) of one glass type in one price list. Set by the CEO. */
export interface Price extends BaseEntity {
  glassTypeId: number;
  priceListId: number;
  pricePerSqFt: number;
}
