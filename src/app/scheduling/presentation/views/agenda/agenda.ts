import {Component, computed, inject, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {AgendaStore, AgendaView} from '../../../application/agenda.store';
import {TechniciansStore} from '../../../application/technicians.store';
import {IamStore} from '../../../../iam/application/iam.store';
import {SavedQuotesStore} from '../../../../quoting/application/saved-quotes.store';
import {Visit, VisitDraft} from '../../../domain/model/visit.entity';
import {DateKey, keyToDate, todayKey, weekDays} from '../../../domain/services/calendar';
import {MonthView} from '../../components/month-view/month-view';
import {WeekView} from '../../components/week-view/week-view';
import {VisitDialog, VisitDialogData} from '../../components/visit-dialog/visit-dialog';
import {VisitDetail, VisitDetailResult} from '../../components/visit-detail/visit-detail';
import {TechniciansDialog} from '../../components/technicians-dialog/technicians-dialog';
import {agendaLocale} from '../../visit-format';

const DIALOG = {width: '680px', maxWidth: 'calc(100vw - 32px)', panelClass: 'al-dialog'};

/**
 * Agenda of technical visits in a month or week calendar. Everyone sees every
 * visit; each visit can be changed by whoever scheduled it or by the CEO.
 * `?cotizacion=<id>` opens a new visit pre-filled from a saved quote.
 */
@Component({
  selector: 'app-agenda',
  imports: [TranslatePipe, MatIconModule, MonthView, WeekView],
  templateUrl: './agenda.html',
  styleUrl: './agenda.css'
})
export class Agenda implements OnInit {
  readonly agenda = inject(AgendaStore);
  readonly technicians = inject(TechniciansStore);
  readonly iam = inject(IamStore);
  private readonly quotes = inject(SavedQuotesStore);
  private readonly dialog = inject(MatDialog);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  readonly techById = computed(() => new Map(this.technicians.all().map(t => [t.id, t])));

  private readonly locale = computed(() => {
    this.agenda.anchor(); // recompute titles when navigating
    return agendaLocale(this.translate);
  });

  /** "noviembre de 2026" or "16 – 22 nov. 2026". */
  readonly title = computed(() => {
    const locale = this.locale();
    if (this.agenda.view() === 'month') {
      return new Intl.DateTimeFormat(locale, {month: 'long', year: 'numeric'}).format(keyToDate(this.agenda.anchor()));
    }
    const days = this.agenda.days();
    return new Intl.DateTimeFormat(locale, {day: 'numeric', month: 'short', year: 'numeric'})
      .formatRange(keyToDate(days[0]), keyToDate(days[6]));
  });

  /** Short weekday names, Monday first. */
  readonly weekdayNames = computed(() => {
    const fmt = new Intl.DateTimeFormat(this.locale(), {weekday: 'short'});
    return weekDays('2026-11-16').map(d => fmt.format(keyToDate(d)));
  });

  /** "lun 16" for each column of the week view. */
  readonly dayLabels = computed(() => {
    const fmt = new Intl.DateTimeFormat(this.locale(), {weekday: 'short', day: 'numeric'});
    return this.agenda.days().slice(0, 7).map(d => fmt.format(keyToDate(d)));
  });

  readonly isCurrentPeriod = computed(() => this.agenda.days().includes(todayKey()));

  ngOnInit(): void {
    this.technicians.ensureLoaded();
    this.agenda.load();
    const quoteId = Number(this.route.snapshot.queryParamMap.get('cotizacion'));
    if (quoteId) this.scheduleFromQuote(quoteId);
  }

  setView(view: AgendaView): void { this.agenda.setView(view); }

  onTechnician(event: Event): void {
    const v = (event.target as HTMLSelectElement).value;
    this.agenda.technicianFilter.set(v ? Number(v) : null);
  }

  newVisit(prefill: Partial<VisitDraft> = {}): void {
    const date = prefill.date ?? (this.isCurrentPeriod() ? todayKey() : this.agenda.days()[0]);
    this.openForm({prefill: {date, ...prefill}});
  }

  createAt(slot: {date: DateKey; time: string}): void { this.newVisit(slot); }

  openVisit(visit: Visit): void {
    this.dialog.open<VisitDetail, Visit, VisitDetailResult>(VisitDetail, {...DIALOG, data: visit, width: '560px'})
      .afterClosed().subscribe(result => {
        if (result && 'edit' in result) this.openForm({visit: result.edit});
      });
  }

  openTechnicians(): void {
    this.dialog.open(TechniciansDialog, {...DIALOG, width: '640px'});
  }

  private openForm(data: VisitDialogData): void {
    this.dialog.open<VisitDialog, VisitDialogData, Visit>(VisitDialog, {...DIALOG, data, autoFocus: '#vd-title-input'})
      .afterClosed().subscribe(saved => {
        if (!saved) return;
        // Show the period where the visit ended up.
        if (!this.agenda.days().includes(saved.date)) { this.agenda.anchor.set(saved.date); this.agenda.load(); }
      });
  }

  /** Pre-fills a visit with the customer of a saved quote, then clears the URL parameter. */
  private scheduleFromQuote(quoteId: number): void {
    this.quotes.open(quoteId, quote => {
      this.router.navigate([], {queryParams: {}, replaceUrl: true}).then();
      this.newVisit({
        title: `${this.translate.instant('agenda.from-quote')} ${quote.number}`,
        customer: {name: quote.customer.name, phone: quote.customer.phone ?? ''},
        address: quote.customer.address ?? '',
        quoteId: quote.id,
      });
    });
  }
}
