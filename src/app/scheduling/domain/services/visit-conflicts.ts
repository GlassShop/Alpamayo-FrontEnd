import {Visit} from '../model/visit.entity';
import {minutesOf} from './calendar';

/** Visits closer than this to each other, for the same technician, are flagged. */
export const CONFLICT_WINDOW_MINUTES = 60;

/**
 * Other active visits of the same technician on the same day that start less
 * than an hour apart from the given time. It only warns: the seller decides
 * whether to change the technician or move the visit.
 */
export function conflictingVisits(
  visits: readonly Visit[],
  candidate: {id?: number; technicianId: number; date: string; time: string},
): Visit[] {
  const at = minutesOf(candidate.time);
  return visits.filter(v =>
    v.id !== candidate.id &&
    v.status !== 'CANCELLED' &&
    v.technicianId === candidate.technicianId &&
    v.date === candidate.date &&
    Math.abs(minutesOf(v.time) - at) < CONFLICT_WINDOW_MINUTES
  );
}

/** The technician's active visits that day, by time (shown while scheduling). */
export function technicianDay(visits: readonly Visit[], technicianId: number, date: string, exceptId?: number): Visit[] {
  return visits
    .filter(v => v.technicianId === technicianId && v.date === date && v.status !== 'CANCELLED' && v.id !== exceptId)
    .sort((a, b) => a.time.localeCompare(b.time));
}
