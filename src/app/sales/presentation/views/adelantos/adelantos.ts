import {Component} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'app-adelantos',
  imports: [MatIconModule],
  template: `
    <div class="adl-placeholder">
      <mat-icon>payments</mat-icon>
      <h3>Registro de Adelantos</h3>
      <p>Aquí podrás registrar y controlar los pagos a cuenta de tus clientes.</p>
      <span class="adl-tag">Próximamente</span>
    </div>
  `,
  styles: [`
    .adl-placeholder {
      display:flex; flex-direction:column; align-items:center; justify-content:center;
      height:100%; padding:60px 24px; gap:12px; text-align:center;
      background:#fff; border:1px dashed #e2e8f0; border-radius:12px;
    }
    mat-icon { font-size:52px; width:52px; height:52px; color:#bae6fd; }
    h3 { margin:0; font-size:1.1rem; font-weight:800; color:#0f172a; }
    p  { margin:0; font-size:0.82rem; color:#64748b; max-width:340px; }
    .adl-tag {
      background:#f0f9ff; color:#0ea5e9; border:1px solid #bae6fd;
      border-radius:99px; padding:4px 16px; font-size:0.72rem; font-weight:700;
      text-transform:uppercase; letter-spacing:.06em;
    }
  `]
})
export class Adelantos {}

