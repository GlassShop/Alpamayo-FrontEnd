import {Component, computed, input, output} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {TranslatePipe} from '@ngx-translate/core';
import {Visit} from '../../../domain/model/visit.entity';
import {Technician} from '../../../domain/model/technician.entity';
import {VISIT_TYPE_ICON} from '../../../domain/model/visit-type';
import {DateKey, sameMonth, todayKey} from '../../../domain/services/calendar';

const MAX_PER_DAY = 3;

/** Month grid (Monday to Sunday) with each day's visits in the technician's colour. */
@Component({
  selector: 'app-month-view',
  imports: [MatIconModule, TranslatePipe],
  templateUrl: './month-view.html',
  styleUrl: './month-view.css'
})
export class MonthView {
  readonly weeks = input.required<DateKey[][]>();
  readonly anchor = input.required<DateKey>();
  readonly byDay = input.required<Map<DateKey, Visit[]>>();
  readonly technicians = input.required<Map<number, Technician>>();
  readonly weekdayNames = input.required<string[]>();

  readonly openVisit = output<Visit>();
  /** A day was chosen (opens its week). */
  readonly openDay = output<DateKey>();

  readonly today = todayKey();
  readonly max = MAX_PER_DAY;
  readonly icon = VISIT_TYPE_ICON;
  readonly rows = computed(() => this.weeks());

  inMonth(day: DateKey): boolean { return sameMonth(day, this.anchor()); }
  dayNumber(day: DateKey): number { return Number(day.slice(8)); }
  visitsOf(day: DateKey): Visit[] { return this.byDay().get(day) ?? []; }
  color(visit: Visit): string { return this.technicians().get(visit.technicianId)?.color ?? '#4b5a70'; }
  techName(visit: Visit): string { return this.technicians().get(visit.technicianId)?.name.split(' ').slice(-1)[0] ?? ''; }

  pick(visit: Visit, event: Event): void {
    event.stopPropagation();
    this.openVisit.emit(visit);
  }
}
