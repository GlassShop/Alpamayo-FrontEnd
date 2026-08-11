import {Component, inject} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {WorkshopStore} from '../../../application/workshop.store';
import {WorkOrderStatus} from '../../../domain/model/work-order.entity';
import {NuevoPedidoDialog, NuevoPedidoResult} from './nuevo-pedido-dialog';

@Component({
  selector: 'app-estado-taller',
  imports: [MatIconModule, MatButtonModule, MatTooltipModule, MatDialogModule],
  templateUrl: './estado-taller.html',
  styleUrl: './estado-taller.css'
})
export class EstadoTaller {
  readonly store  = inject(WorkshopStore);
  readonly dialog = inject(MatDialog);

  readonly statusLabel: Record<WorkOrderStatus, string> = {
    'queue':      'En Cola',
    'in-process': 'En proceso',
    'finishing':  'Finalizando',
    'completed':  'Completado',
    'delayed':    'Demorado',
  };

  readonly progressClass: Record<WorkOrderStatus, string> = {
    'queue':      'bar--queue',
    'in-process': 'bar--process',
    'finishing':  'bar--finishing',
    'completed':  'bar--completed',
    'delayed':    'bar--delayed',
  };

  workerInitials(name: string): string {
    return name ? name.slice(0, 2).toUpperCase() : '??';
  }

  openNuevoPedido(): void {
    const ref = this.dialog.open(NuevoPedidoDialog, { width: '500px' });
    ref.afterClosed().subscribe((result: NuevoPedidoResult | undefined) => {
      if (result) this.store.addWorkOrder(result);
    });
  }
}
