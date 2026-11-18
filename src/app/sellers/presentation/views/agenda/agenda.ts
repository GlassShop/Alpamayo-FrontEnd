import {Component, inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {AgendaStore} from '../../../application/agenda.store';
import {VisitStatus} from '../../../domain/model/visit.entity';

@Component({
  selector: 'app-agenda',
  imports: [
    FormsModule, RouterLink,
    MatIconModule, MatButtonModule, MatCardModule,
    MatFormFieldModule, MatInputModule
  ],
  templateUrl: './agenda.html',
  styleUrl: './agenda.css'
})
export class Agenda {
  readonly store = inject(AgendaStore);

  newTitle = '';
  newClient = '';
  newLocation = '';
  newScheduledAt = '';

  readonly statusLabel: Record<VisitStatus, string> = {
    scheduled: 'Agendada',
    completed: 'Completada',
    cancelled: 'Cancelada'
  };

  addVisit(): void {
    if (!this.newTitle.trim() || !this.newClient.trim() || !this.newScheduledAt.trim()) return;
    this.store.addVisit({
      title: this.newTitle.trim(),
      client: this.newClient.trim(),
      location: this.newLocation.trim() || 'Por definir',
      scheduledAt: this.newScheduledAt.trim()
    });
    this.newTitle = this.newClient = this.newLocation = this.newScheduledAt = '';
  }

  completeVisit(id: number): void {
    this.store.updateStatus(id, 'completed');
  }
}
