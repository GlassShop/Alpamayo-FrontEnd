import {addDays, addMonths, hourSlot, monthGrid, startOfWeek, todayKey, weekDays, weekdayIndex} from './calendar';

describe('calendar', () => {
  it('starts weeks on Monday', () => {
    // 1 Nov 2026 is a Sunday
    expect(weekdayIndex('2026-11-01')).toBe(6);
    expect(weekdayIndex('2026-11-02')).toBe(0);
    expect(startOfWeek('2026-11-18')).toBe('2026-11-16');
    expect(weekDays('2026-11-18')).toEqual([
      '2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21', '2026-11-22',
    ]);
  });

  it('covers a month with 4, 5 or 6 week rows', () => {
    const nov = monthGrid('2026-11-18');
    expect(nov.length).toBe(6);
    expect(nov[0][0]).toBe('2026-10-26');
    expect(nov[5][6]).toBe('2026-12-06');
    expect(monthGrid('2026-12-01').length).toBe(5);
    // February 2027 starts on Monday and has 28 days: exactly 4 rows
    const feb = monthGrid('2027-02-10');
    expect(feb.length).toBe(4);
    expect(feb[0][0]).toBe('2027-02-01');
    expect(feb[3][6]).toBe('2027-02-28');
  });

  it('navigates across months and years', () => {
    expect(addMonths('2026-12-31', 1)).toBe('2027-01-01');
    expect(addMonths('2026-01-31', -1)).toBe('2025-12-01');
    expect(addDays('2026-12-28', 7)).toBe('2027-01-04');
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
  });

  it('places times in the shown hour slots', () => {
    expect(hourSlot('10:45')).toBe(10);
    expect(hourSlot('06:30')).toBe(7);
    expect(hourSlot('22:00')).toBe(20);
  });

  it('builds today from the local date', () => {
    expect(todayKey(new Date(2026, 10, 18, 23, 30))).toBe('2026-11-18');
  });
});
