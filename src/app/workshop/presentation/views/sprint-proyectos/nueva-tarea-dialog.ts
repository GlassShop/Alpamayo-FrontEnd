import {Component, Inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {TaskStatus} from '../../../domain/model/sprint-task.entity';

export interface NuevaTareaResult {
  title: string;
  worker: string;
  priority: number;
  status: TaskStatus;
  startDate?: string;
  endDate?: string;
}

@Component({
  selector: 'app-nueva-tarea-dialog',
  imports: [FormsModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="ntd-wrap">
      <div class="ntd-head">
        <mat-icon class="ntd-icon">add_task</mat-icon>
        <div>
          <h2 class="ntd-title">Nueva Tarea de Proyecto</h2>
          <p class="ntd-sub">Agrega una tarea al sprint de producción</p>
        </div>
      </div>

      <mat-dialog-content class="ntd-body">
        <div class="ntd-grid">
          <div class="ntd-field ntd-field--full">
            <label class="ntd-label">Título de la Tarea *</label>
            <input class="ntd-input" [(ngModel)]="title" placeholder="Ej: VENTANA CORREDIZA - CLIENTE"/>
          </div>
          <div class="ntd-field">
            <label class="ntd-label">Trabajador</label>
            <select class="ntd-input" [(ngModel)]="worker">
              <option value="">— Sin asignar —</option>
              @for (w of workers; track w) {
                <option [value]="w">{{ w }}</option>
              }
            </select>
          </div>
          <div class="ntd-field">
            <label class="ntd-label">Prioridad (1–8)</label>
            <select class="ntd-input" [(ngModel)]="priority">
              @for (p of priorities; track p.val) {
                <option [value]="p.val">{{ p.val }} – {{ p.label }}</option>
              }
            </select>
          </div>
          <div class="ntd-field">
            <label class="ntd-label">Estado</label>
            <select class="ntd-input" [(ngModel)]="status">
              <option value="not-started">Sin comenzar</option>
              <option value="in-progress">En curso</option>
              <option value="blocked">Bloqueado</option>
              <option value="unpaid">Falta pagar</option>
            </select>
          </div>
          <div class="ntd-field">
            <label class="ntd-label">Fecha de Inicio</label>
            <input class="ntd-input" [(ngModel)]="startDate" placeholder="dd/mm/aaaa"/>
          </div>
          <div class="ntd-field">
            <label class="ntd-label">Fecha de Finalización</label>
            <input class="ntd-input" [(ngModel)]="endDate" placeholder="dd/mm/aaaa"/>
          </div>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="ntd-actions">
        <button mat-button mat-dialog-close class="ntd-cancel">Cancelar</button>
        <button mat-flat-button class="ntd-save"
                [disabled]="!title.trim()"
                (click)="save()">
          <mat-icon>add_task</mat-icon>
          Agregar Tarea
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .ntd-wrap { min-width: 480px; font-family: 'Segoe UI', Arial, sans-serif; }
    .ntd-head { display:flex; align-items:flex-start; gap:12px; padding:20px 24px 0; }
    .ntd-icon { font-size:26px; width:26px; height:26px; color:#3b82f6; margin-top:2px; }
    .ntd-title { margin:0; font-size:1rem; font-weight:800; color:#0f172a; }
    .ntd-sub   { margin:3px 0 0; font-size:0.72rem; color:#64748b; }
    mat-dialog-content { padding:16px 24px !important; }
    .ntd-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .ntd-field { display:flex; flex-direction:column; gap:4px; }
    .ntd-field--full { grid-column:1/-1; }
    .ntd-label { font-size:0.62rem; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:.05em; }
    .ntd-input {
      height:36px; border:1px solid #e2e8f0; border-radius:8px;
      padding:0 12px; font-size:0.83rem; color:#0f172a;
      outline:none; background:#f8fafc; width:100%; box-sizing:border-box;
    }
    .ntd-input:focus { border-color:#3b82f6; background:#fff; }
    mat-dialog-actions { padding:8px 24px 18px !important; }
    .ntd-cancel { color:#64748b !important; font-weight:600 !important; }
    .ntd-save {
      background:#1e293b !important; color:#fff !important;
      font-weight:700 !important; border-radius:8px !important;
      display:flex; align-items:center; gap:4px;
    }
    .ntd-save mat-icon { font-size:16px; width:16px; height:16px; }
    .ntd-save:disabled { background:#e2e8f0 !important; color:#94a3b8 !important; }
  `]
})
export class NuevaTareaDialog {
  title     = '';
  worker    = '';
  priority  = 3;
  status: TaskStatus = 'not-started';
  startDate = '';
  endDate   = '';

  workers    = ['HERNAN', 'PEDRO', 'MAYCOL', 'PERO', 'MAGNO', 'CARLOS', 'JUAN'];
  priorities = [
    {val:1, label:'Muy Baja'}, {val:2, label:'Baja'}, {val:3, label:'Normal'},
    {val:4, label:'Media'},   {val:5, label:'Alta'},  {val:6, label:'Muy Alta'},
    {val:7, label:'Urgente'}, {val:8, label:'Crítica'}
  ];

  constructor(private ref: MatDialogRef<NuevaTareaDialog>) {}

  save(): void {
    if (!this.title.trim()) return;
    const result: NuevaTareaResult = {
      title:     this.title.trim(),
      worker:    this.worker,
      priority:  this.priority,
      status:    this.status,
      startDate: this.startDate || undefined,
      endDate:   this.endDate   || undefined,
    };
    this.ref.close(result);
  }
}

