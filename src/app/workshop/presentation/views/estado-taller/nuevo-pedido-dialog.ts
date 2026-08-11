import {Component, Inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatDialogModule, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {WorkOrderStage} from '../../../domain/model/work-order.entity';

export interface NuevoPedidoResult {
  clientName: string;
  productDesc: string;
  stage: WorkOrderStage;
  worker: string;
}

@Component({
  selector: 'app-nuevo-pedido-dialog',
  imports: [FormsModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="npd-wrap">
      <div class="npd-head">
        <mat-icon class="npd-icon">add_circle</mat-icon>
        <div>
          <h2 class="npd-title">Nuevo Pedido de Producción</h2>
          <p class="npd-sub">Registra un nuevo pedido en la línea de producción</p>
        </div>
      </div>

      <mat-dialog-content class="npd-body">
        <div class="npd-grid">
          <div class="npd-field npd-field--full">
            <label class="npd-label">Cliente *</label>
            <input class="npd-input" [(ngModel)]="clientName" placeholder="Nombre del cliente o empresa"/>
          </div>
          <div class="npd-field npd-field--full">
            <label class="npd-label">Descripción del Producto *</label>
            <input class="npd-input" [(ngModel)]="productDesc" placeholder="Ej: Ventana Corrediza Serie 25 – 6mm"/>
          </div>
          <div class="npd-field">
            <label class="npd-label">Etapa Inicial</label>
            <select class="npd-input" [(ngModel)]="stage">
              <option value="queue">EN COLA / PENDIENTE</option>
              <option value="cutting">CORTE & PULIDO</option>
              <option value="assembly">ARMADO / TEMPLADO</option>
              <option value="qc">CONTROL DE CALIDAD</option>
              <option value="dispatch">LISTO PARA DESPACHO</option>
            </select>
          </div>
          <div class="npd-field">
            <label class="npd-label">Trabajador Asignado</label>
            <select class="npd-input" [(ngModel)]="worker">
              <option value="">— Sin asignar —</option>
              @for (w of workers; track w) {
                <option [value]="w">{{ w }}</option>
              }
            </select>
          </div>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="npd-actions">
        <button mat-button mat-dialog-close class="npd-cancel">Cancelar</button>
        <button mat-flat-button class="npd-save"
                [disabled]="!clientName.trim() || !productDesc.trim()"
                (click)="save()">
          <mat-icon>check_circle</mat-icon>
          Crear Pedido
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .npd-wrap { min-width: 460px; font-family: 'Segoe UI', Arial, sans-serif; }
    .npd-head { display:flex; align-items:flex-start; gap:12px; padding:20px 24px 0; }
    .npd-icon { font-size:26px; width:26px; height:26px; color:#ef4444; margin-top:2px; }
    .npd-title { margin:0; font-size:1rem; font-weight:800; color:#0f172a; }
    .npd-sub   { margin:3px 0 0; font-size:0.72rem; color:#64748b; }
    mat-dialog-content { padding: 16px 24px !important; }
    .npd-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .npd-field { display:flex; flex-direction:column; gap:4px; }
    .npd-field--full { grid-column:1/-1; }
    .npd-label { font-size:0.62rem; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:.05em; }
    .npd-input {
      height:36px; border:1px solid #e2e8f0; border-radius:8px;
      padding:0 12px; font-size:0.83rem; color:#0f172a;
      outline:none; background:#f8fafc; width:100%; box-sizing:border-box;
    }
    .npd-input:focus { border-color:#ef4444; background:#fff; }
    mat-dialog-actions { padding:8px 24px 18px !important; }
    .npd-cancel { color:#64748b !important; font-weight:600 !important; }
    .npd-save {
      background:#ef4444 !important; color:#fff !important;
      font-weight:700 !important; border-radius:8px !important;
      display:flex; align-items:center; gap:4px;
    }
    .npd-save mat-icon { font-size:16px; width:16px; height:16px; }
    .npd-save:disabled { background:#e2e8f0 !important; color:#94a3b8 !important; }
  `]
})
export class NuevoPedidoDialog {
  clientName = '';
  productDesc = '';
  stage: WorkOrderStage = 'queue';
  worker = '';
  workers = ['HERNAN', 'PEDRO', 'MAYCOL', 'PERO', 'MAGNO', 'CARLOS', 'JUAN'];

  constructor(private ref: MatDialogRef<NuevoPedidoDialog>) {}

  save(): void {
    if (!this.clientName.trim() || !this.productDesc.trim()) return;
    const result: NuevoPedidoResult = {
      clientName:  this.clientName.trim(),
      productDesc: this.productDesc.trim(),
      stage:       this.stage,
      worker:      this.worker
    };
    this.ref.close(result);
  }
}

