import {Component} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {Customer} from '../../../../domain/model/customer.entity';

@Component({
  selector: 'app-add-customer-dialog',
  imports: [FormsModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="acd-header">
      <mat-icon>person_add</mat-icon>
      <h2 mat-dialog-title>Nuevo Cliente</h2>
    </div>
    <mat-dialog-content>
      <div class="acd-form">
        <label class="acd-label">Tipo de Documento</label>
        <select class="acd-select" [(ngModel)]="docType">
          <option value="RUC">RUC (Empresa)</option>
          <option value="DNI">DNI (Persona)</option>
        </select>

        <label class="acd-label">Número de Documento</label>
        <input class="acd-input" [(ngModel)]="docNumber" [placeholder]="docType === 'RUC' ? '20XXXXXXXXX' : '########'"/>

        <label class="acd-label">Nombre / Razón Social</label>
        <input class="acd-input" [(ngModel)]="name" placeholder="Nombre completo o razón social"/>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close class="acd-cancel">Cancelar</button>
      <button mat-flat-button class="acd-save" [disabled]="!isValid()" (click)="save()">
        <mat-icon>save</mat-icon>
        Guardar Cliente
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .acd-header { display:flex; align-items:center; gap:10px; padding:16px 24px 0; }
    .acd-header mat-icon { color:#3b82f6; font-size:22px; width:22px; height:22px; }
    .acd-header h2 { margin:0; font-size:1rem; font-weight:800; color:#0f172a; }
    mat-dialog-content { padding:12px 24px !important; }
    .acd-form { display:flex; flex-direction:column; gap:8px; }
    .acd-label { font-size:0.72rem; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:.04em; margin-bottom:-4px; }
    .acd-input, .acd-select {
      height:36px; border:1px solid #e2e8f0; border-radius:8px;
      padding:0 12px; font-size:0.83rem; color:#1e293b; outline:none;
      background:#f8fafc; width:100%; box-sizing:border-box;
    }
    .acd-input:focus, .acd-select:focus { border-color:#3b82f6; background:#ffffff; }
    mat-dialog-actions { padding:8px 24px 16px !important; }
    .acd-cancel { color:#64748b !important; font-weight:600 !important; }
    .acd-save { background:#3b82f6 !important; color:#fff !important; font-weight:700 !important; border-radius:8px !important; gap:4px; display:flex; align-items:center; }
    .acd-save mat-icon { font-size:16px; width:16px; height:16px; }
  `]
})
export class AddCustomerDialogComponent {
  name      = '';
  docType: 'RUC' | 'DNI' = 'RUC';
  docNumber = '';

  constructor(private ref: MatDialogRef<AddCustomerDialogComponent>) {}

  isValid(): boolean {
    return !!(this.name.trim() && this.docNumber.trim());
  }

  save(): void {
    if (!this.isValid()) return;
    const customer: Customer = {
      id: `c-${Date.now()}`,
      name: this.name.trim(),
      docType: this.docType,
      docNumber: this.docNumber.trim()
    };
    this.ref.close(customer);
  }
}

