import {Visit} from '../model/visit.entity';
import {conflictingVisits, technicianDay} from './visit-conflicts';

const visit = (id: number, technicianId: number, date: string, time: string, status: Visit['status'] = 'SCHEDULED'): Visit => ({
  id, technicianId, date, time, status, type: 'MEASUREMENT', title: 'Medición', customer: {name: 'X', phone: '943111222'},
  address: 'Jr. Ficticio 100', createdBy: {id: 2, fullName: 'Ana'}, createdAt: '', changes: [],
});

const day = [
  visit(1, 1, '2026-11-20', '10:00'),
  visit(2, 1, '2026-11-20', '15:00'),
  visit(3, 2, '2026-11-20', '10:00'),
  visit(4, 1, '2026-11-20', '10:30', 'CANCELLED'),
  visit(5, 1, '2026-11-21', '10:00'),
];

describe('visit conflicts', () => {
  it('flags the same technician less than an hour apart on the same day', () => {
    expect(conflictingVisits(day, {technicianId: 1, date: '2026-11-20', time: '10:30'}).map(v => v.id)).toEqual([1]);
    expect(conflictingVisits(day, {technicianId: 1, date: '2026-11-20', time: '09:01'}).map(v => v.id)).toEqual([1]);
  });

  it('ignores other technicians, other days, cancelled visits and visits an hour or more apart', () => {
    expect(conflictingVisits(day, {technicianId: 1, date: '2026-11-20', time: '12:00'})).toEqual([]);
    expect(conflictingVisits(day, {technicianId: 1, date: '2026-11-20', time: '11:00'})).toEqual([]);
    expect(conflictingVisits(day, {technicianId: 3, date: '2026-11-20', time: '10:00'})).toEqual([]);
  });

  it('does not compare a visit with itself when editing it', () => {
    expect(conflictingVisits(day, {id: 1, technicianId: 1, date: '2026-11-20', time: '10:00'})).toEqual([]);
  });

  it('lists the technician day in order, without cancelled visits', () => {
    expect(technicianDay(day, 1, '2026-11-20').map(v => v.time)).toEqual(['10:00', '15:00']);
    expect(technicianDay(day, 1, '2026-11-20', 1).map(v => v.id)).toEqual([2]);
  });
});
