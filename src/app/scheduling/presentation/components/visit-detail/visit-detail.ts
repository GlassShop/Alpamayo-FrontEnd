import {Component, computed, inject, signal} from '@angular/core';
import {DatePipe} from '@angular/common';
import {RouterLink} from '@angular/router';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {AgendaStore} from '../../../application/agenda.store';
import {TechniciansStore} from '../../../application/technicians.store';
import {Visit} from '../../../domain/model/visit.entity';
import {VISIT_TYPE_ICON, VisitStatus} from '../../../domain/model/visit-type';
import {mapsLink, whatsappLink} from '../../../domain/services/contact-links';
import {COMPANY_PROFILE} from '../../../../shared/domain/model/company-profile';
import {agendaLocale, longDay} from '../../visit-format';

/** Closing result: the updated visit, or a request to open the edit form. */
export type VisitDetailResult = {updated: Visit} | {edit: Visit};

/**
 * Details of a visit with quick contact links (WhatsApp to the technician
 * with everything they need, WhatsApp to the customer, Google Maps), its
 * change history and, for its author or the CEO, edit / done / cancel.
 */
@Component({
  selector: 'app-visit-detail',
  imports: [DatePipe, RouterLink, TranslatePipe, MatIconModule],
  templateUrl: './visit-detail.html',
  styleUrl: './visit-detail.css'
})
export class VisitDetail {
  readonly agenda = inject(AgendaStore);
  private readonly technicians = inject(TechniciansStore);
  private readonly translate = inject(TranslateService);
  private readonly ref = inject(MatDialogRef<VisitDetail, VisitDetailResult>);
  readonly visit = signal(inject<Visit>(MAT_DIALOG_DATA));
  readonly icon = VISIT_TYPE_ICON;

  readonly technician = computed(() => this.technicians.find(this.visit().technicianId));
  readonly canEdit = computed(() => this.agenda.canEdit(this.visit()));
  readonly day = computed(() => longDay(this.visit().date, agendaLocale(this.translate)));
  /** Same day with a capital first letter, for the header. */
  readonly dayTitle = computed(() => this.day().charAt(0).toUpperCase() + this.day().slice(1));
  readonly maps = computed(() => mapsLink(this.visit().address, COMPANY_PROFILE.city));

  /** Everything the technician needs, since they do not use the app. */
  readonly whatsappTechnician = computed(() => {
    const tech = this.technician();
    if (!tech) return null;
    const v = this.visit();
    const lines = [
      this.translate.instant('agenda.whatsapp.technician', {name: tech.name.split(' ')[0]}),
      `${this.translate.instant('agenda.types.' + v.type)}: ${v.title}`,
      `${this.day()} · ${v.time}`,
      `${v.customer.name} · ${v.customer.phone}`,
      `${v.address}${v.reference ? ' (' + v.reference + ')' : ''}`,
      this.maps(),
      ...(v.specs ? [`${this.translate.instant('agenda.specs')}: ${v.specs}`] : []),
    ];
    return whatsappLink(tech.phone, lines.join('\n'));
  });

  readonly whatsappCustomer = computed(() => {
    const v = this.visit();
    const message = this.translate.instant('agenda.whatsapp.customer', {
      name: v.customer.name.split(' ')[0], company: COMPANY_PROFILE.name, day: this.day(), time: v.time,
      job: v.title, technician: this.technician()?.name ?? '',
    });
    return whatsappLink(v.customer.phone, message);
  });

  /** Readable names of the fields a change touched. */
  fieldsLabel(fields: string[]): string {
    return fields.map(f => this.translate.instant('agenda.fields.' + f)).join(', ');
  }

  edit(): void { this.ref.close({edit: this.visit()}); }

  setStatus(status: VisitStatus): void {
    if (status === 'CANCELLED' && !globalThis.confirm?.(this.translate.instant('agenda.confirm-cancel'))) return;
    this.agenda.setStatus(this.visit(), status, saved => this.visit.set(saved));
  }

  close(): void { this.ref.close({updated: this.visit()}); }
}
