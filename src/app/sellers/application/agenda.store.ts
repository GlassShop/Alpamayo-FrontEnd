import {computed, inject, Injectable, signal} from '@angular/core';
import {Visit, VisitStatus} from '../domain/model/visit.entity';
import {DashboardStore} from './dashboard.store';

@Injectable({providedIn: 'root'})
export class AgendaStore {
  private readonly dashboardStore = inject(DashboardStore);
  private readonly visitsSignal = signal<Visit[]>(this.buildInitialVisits());
  private nextId = 100;

  readonly visits = this.visitsSignal.asReadonly();
  readonly upcomingVisits = computed(() =>
    this.visits().filter(v => v.status === 'scheduled')
  );
  readonly completedVisits = computed(() =>
    this.visits().filter(v => v.status !== 'scheduled')
  );

  addVisit(partial: { title: string; client: string; location: string; scheduledAt: string; notes?: string }): void {
    const visit = new Visit({
      id: ++this.nextId,
      title: partial.title,
      client: partial.client,
      location: partial.location,
      scheduledAt: partial.scheduledAt,
      status: 'scheduled',
      notes: partial.notes
    });
    this.visitsSignal.update(list => [...list, visit].sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt)));
  }

  updateStatus(id: number, status: VisitStatus): void {
    this.visitsSignal.update(list =>
      list.map(v => v.id === id ? new Visit({ ...this.toPlain(v), status }) : v)
    );
  }

  private buildInitialVisits(): Visit[] {
    const scheduled = this.dashboardStore.summary().recentActivities
      .filter(a => a.status === 'scheduled')
      .map(a => new Visit({
        id: a.id,
        title: a.document,
        client: a.client,
        location: a.clientDetail,
        scheduledAt: a.timeAgo,
        status: 'scheduled'
      }));

    return [
      ...scheduled,
      new Visit({
        id: 2,
        title: 'Entrega de muestras',
        client: 'Constructora Altiplano S.A.C.',
        location: 'Av. Centenario 450, Huaraz',
        scheduledAt: 'Viernes 10:00',
        status: 'scheduled'
      }),
      new Visit({
        id: 3,
        title: 'Medición fachada',
        client: 'Hotel Costa Verde',
        location: 'Playa Tortuga, Caraz',
        scheduledAt: 'Lunes 09:30',
        status: 'scheduled',
        notes: 'Llevar planos Serie 25'
      })
    ];
  }

  private toPlain(v: Visit) {
    return {
      id: v.id,
      title: v.title,
      client: v.client,
      location: v.location,
      scheduledAt: v.scheduledAt,
      status: v.status,
      notes: v.notes
    };
  }
}
