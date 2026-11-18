import {BaseEntity} from '../../../shared/domain/model/base-entity';

/** A kind of glass sold by the square foot, e.g. "Laminado" 6 mm "cielo". */
export interface GlassType extends BaseEntity {
  name: string;
  thicknessMm: number;
  color: string;
}

/** Human-readable label: "Laminado 6 mm cielo". */
export function glassTypeLabel(glass: GlassType): string {
  return `${glass.name} ${glass.thicknessMm} mm ${glass.color}`.trim();
}
