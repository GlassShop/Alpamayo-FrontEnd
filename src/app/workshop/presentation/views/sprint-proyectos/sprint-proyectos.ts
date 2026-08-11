import {Component, inject} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {WorkshopStore} from '../../../application/workshop.store';
import {TaskStatus} from '../../../domain/model/sprint-task.entity';
import {NuevaTareaDialog, NuevaTareaResult} from './nueva-tarea-dialog';

@Component({
  selector: 'app-sprint-proyectos',
  imports: [MatIconModule, MatButtonModule, MatDialogModule],
  templateUrl: './sprint-proyectos.html',
  styleUrl: './sprint-proyectos.css'
})
export class SprintProyectos {
  readonly store  = inject(WorkshopStore);
  readonly dialog = inject(MatDialog);

  readonly CELL_W = 52;

  readonly statusLabel: Record<TaskStatus, string> = {
    'blocked':     'Bloqueado',
    'unpaid':      'Falta pagar',
    'in-progress': 'En curso',
    'not-started': 'Sin comenzar',
  };

  priorityBg(p: number): string {
    if (p >= 7) return '#fef2f2';
    if (p >= 4) return '#fefce8';
    if (p >= 2) return '#f0fdf4';
    return '#f0fdfa';
  }
  priorityColor(p: number): string {
    if (p >= 7) return '#dc2626';
    if (p >= 4) return '#ca8a04';
    if (p >= 2) return '#16a34a';
    return '#0d9488';
  }

  openNuevaTarea(): void {
    const ref = this.dialog.open(NuevaTareaDialog, { width: '520px' });
    ref.afterClosed().subscribe((result: NuevaTareaResult | undefined) => {
      if (result) this.store.addSprintTask(result);
    });
  }
}
