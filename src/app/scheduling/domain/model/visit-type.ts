/** What the technician goes to do. */
export type VisitType = 'MEASUREMENT' | 'INSTALLATION' | 'REPAIR' | 'OTHER';

export const VISIT_TYPES: readonly VisitType[] = ['MEASUREMENT', 'INSTALLATION', 'REPAIR', 'OTHER'];

/** Material icon shown on the calendar for each type. */
export const VISIT_TYPE_ICON: Readonly<Record<VisitType, string>> = {
  MEASUREMENT: 'straighten',
  INSTALLATION: 'construction',
  REPAIR: 'build',
  OTHER: 'event_note',
};

/** Visit lifecycle. Cancelled visits are kept (crossed out), never deleted. */
export type VisitStatus = 'SCHEDULED' | 'DONE' | 'CANCELLED';

export const VISIT_STATUSES: readonly VisitStatus[] = ['SCHEDULED', 'DONE', 'CANCELLED'];
