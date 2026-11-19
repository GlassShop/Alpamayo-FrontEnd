import {BaseEntity} from '../../../shared/domain/model/base-entity';

/** Place where stock is kept, e.g. "Principal" or "Almacén Los Libertadores". */
export interface Site extends BaseEntity {
  name: string;
  address: string;
}
