import {Component, input, output} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {TranslatePipe} from '@ngx-translate/core';
import {Visit} from '../../../domain/model/visit.entity';
import {Technician} from '../../../domain/model/technician.entity';
import {VISIT_TYPE_ICON} from '../../../domain/model/visit-type';
import {DateKey, DAY_HOURS, hourSlot, todayKey} from '../../../domain/services/calendar';

/** Week grid: days as columns, hours (7:00–20:00) as rows. Empty slots create a visit there. */
@Component({
  selector: 'app-week-view',
  imports: [MatIconModule, TranslatePipe],
  templateUrl: './week-view.html',
  styleUrl: './week-view.css'
})
export class WeekView {
  readonly days = input.required<DateKey[]>();
  readonly byDay = input.required<Map<DateKey, Visit[]>>();
  readonly technicians = input.required<Map<number, Technician>>();
  readonly dayLabels = input.required<string[]>();

  readonly openVisit = output<Visit>();
  /** An empty slot was chosen: create a visit on that day at that hour. */
  readonly createAt = output<{date: DateKey; time: string}>();

  readonly hours = DAY_HOURS;
  readonly today = todayKey();
  readonly icon = VISIT_TYPE_ICON;

  visitsAt(day: DateKey, hour: number): Visit[] {
    return (this.byDay().get(day) ?? []).filter(v => hourSlot(v.time) === hour);
  }

  color(visit: Visit): string { return this.technicians().get(visit.technicianId)?.color ?? '#4b5a70'; }
  techName(visit: Visit): string { return this.technicians().get(visit.technicianId)?.name ?? ''; }
  label(hour: number): string { return `${String(hour).padStart(2, '0')}:00`; }

  create(day: DateKey, hour: number): void { this.createAt.emit({date: day, time: this.label(hour)}); }
}
