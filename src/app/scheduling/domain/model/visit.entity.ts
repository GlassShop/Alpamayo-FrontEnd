import {BaseEntity} from '../../../shared/domain/model/base-entity';
import {VisitStatus, VisitType} from './visit-type';

/** One recorded change of a visit, written by the server. */
export interface VisitChange {
  /** ISO-8601 date-time. */
  at: string;
  by: {id: number; fullName: string};
  /** 'created' or the fields that changed, e.g. ['technicianId', 'time']. */
  fields: string[];
}

/** Everything the seller fills in for a visit. */
export interface VisitDraft {
  /** Local date "YYYY-MM-DD" (no time zone: Peru has a single zone, no DST). */
  date: string;
  /** Local time "HH:mm". */
  time: string;
  technicianId: number;
  type: VisitType;
  /** Project or job name, e.g. "Medición de puerta". */
  title: string;
  customer: {name: string; phone: string};
  address: string;
  reference?: string;
  /** Technical notes for the technician (optional). */
  specs?: string;
  /** Saved quote this visit comes from, if any. */
  quoteId?: number;
}

/** A technical visit to a customer's home or site. */
export interface Visit extends VisitDraft, BaseEntity {
  status: VisitStatus;
  createdBy: {id: number; fullName: string};
  createdAt: string;
  changes: VisitChange[];
}
