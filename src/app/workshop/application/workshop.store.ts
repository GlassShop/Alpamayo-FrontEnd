import {Injectable, signal, computed} from '@angular/core';
import {WorkOrder, WorkOrderStage, KanbanStage} from '../domain/model/work-order.entity';
import {SprintTask} from '../domain/model/sprint-task.entity';

const MOCK_ORDERS: WorkOrder[] = [
  { id:'o1',  orderId:'#ORD-9421', timeLabel:'Hace 2h',      status:'queue',      stage:'queue',    clientName:'Inmobiliaria SkyTower',    productDesc:'Cristal Templado 10mm',        progressPct:10,  worker:'HERNAN' },
  { id:'o2',  orderId:'#ORD-9405', timeLabel:'Hace 3h',      status:'delayed',    stage:'queue',    clientName:'Constructora Pacific',     productDesc:'Laminado de Seguridad 4+4',    progressPct:0,   worker:'PEDRO',  actionBtn:'Contactar Taller' },
  { id:'o3',  orderId:'#ORD-9401', timeLabel:'Hace 5h',      status:'queue',      stage:'queue',    clientName:'Hotel Costa Verde',        productDesc:'Mampara de Vidrio 8mm',        progressPct:5,   worker:'CARLOS' },
  { id:'o4',  orderId:'#ORD-9397', timeLabel:'Hace 1d',      status:'queue',      stage:'queue',    clientName:'Clínica San Pablo',        productDesc:'Ventanas Corredizas Aluminio', progressPct:0,   worker:'JUAN' },
  { id:'o5',  orderId:'#ORD-9398', timeLabel:'En proceso',   status:'in-process', stage:'cutting',  clientName:'Vidrios San Juan',         productDesc:'Espejo Biselado 5mm',          progressPct:55,  worker:'MAYCOL', extraBadge:'Corte CNC' },
  { id:'o6',  orderId:'#ORD-9389', timeLabel:'En proceso',   status:'in-process', stage:'cutting',  clientName:'Oficinas Torres Lima',     productDesc:'Vidrio Float 6mm',             progressPct:40,  worker:'PERO',   extraBadge:'Mesa 2' },
  { id:'o7',  orderId:'#ORD-9350', timeLabel:'Horno Lote 4', status:'in-process', stage:'assembly', clientName:'Residencial Bellavista',   productDesc:'Cerramiento de Aluminio',      progressPct:70,  worker:'HERNAN', extraBadge:'Temp: 620°C' },
  { id:'o8',  orderId:'#ORD-9343', timeLabel:'En proceso',   status:'in-process', stage:'assembly', clientName:'Centro Comercial Sol',     productDesc:'Puerta Batiente 10mm',         progressPct:60,  worker:'MAGNO' },
  { id:'o9',  orderId:'#ORD-9339', timeLabel:'Finalizando',  status:'finishing',  stage:'assembly', clientName:'Banco Central Norte',      productDesc:'Fachada Estructural',          progressPct:85,  worker:'PEDRO' },
  { id:'o10', orderId:'#ORD-9312', timeLabel:'Finalizando',  status:'finishing',  stage:'qc',       clientName:'Plaza Comercial Norte',    productDesc:'Vidrio Insulado (DVH)',        progressPct:90,  worker:'CARLOS', extraBadge:'Consultar QC' },
  { id:'o11', orderId:'#ORD-9288', timeLabel:'Completado',   status:'completed',  stage:'dispatch', clientName:'Arquitectura Moderna S.A.', productDesc:'Fachada Integral Vidrio',    progressPct:100, worker:'HERNAN', actionBtn:'Comunicarse con el cliente', extraBadge:'Ruta A-12' },
  { id:'o12', orderId:'#ORD-9285', timeLabel:'Completado',   status:'completed',  stage:'dispatch', clientName:'Hogar & Estilo',           productDesc:'Box de Ducha 8mm',             progressPct:100, worker:'JUAN',   actionBtn:'Ver Albarán',               extraBadge:'Bodega: B3' },
  { id:'o13', orderId:'#ORD-9280', timeLabel:'Completado',   status:'completed',  stage:'dispatch', clientName:'Ferrería Huaraz',          productDesc:'Espejos Decorativos 4mm',      progressPct:100, worker:'PEDRO' },
  { id:'o14', orderId:'#ORD-9275', timeLabel:'Completado',   status:'completed',  stage:'dispatch', clientName:'Universidad Ancash',       productDesc:'Ventanas Fijas 8mm',          progressPct:100, worker:'MAYCOL' },
  { id:'o15', orderId:'#ORD-9271', timeLabel:'Completado',   status:'completed',  stage:'dispatch', clientName:'Municipalidad Huaraz',     productDesc:'Tabiques de Vidrio',          progressPct:100, worker:'CARLOS' },
  { id:'o16', orderId:'#ORD-9265', timeLabel:'Completado',   status:'completed',  stage:'dispatch', clientName:'Corporación del Norte',    productDesc:'Muro Cortina Aluminio',        progressPct:100, worker:'PERO' },
];

const MOCK_TASKS: SprintTask[] = [
  { id:'t1',              title:'ESTRUCTURA - CAMI',        worker:'HERNAN', priority:3, status:'blocked',     startDate:'17/06/2026', endDate:'29/06/2026', fileInfo:'Archivos' },
  { id:'t2',              title:'BARANDA DE ACERO - CAMI',  worker:'PEDRO',  priority:2, status:'unpaid',      startDate:'20/05/2026', endDate:'16/05/2026', fileInfo:'Archivos' },
  { id:'t3',              title:'SERIE 80 - CAMI',          worker:'MAYCOL', priority:3, status:'in-progress', startDate:'8/06/2026',  endDate:'30/08/2026', fileInfo:'Archivos', ganttDay:1, ganttSpan:4, ganttColor:'#86efac' },
  { id:'t4', code:'538937', title:'VIDRIOS-DUCHAS - JENNI',   worker:'PERO',   priority:3, status:'in-progress', endDate:'22/07/2026',  fileInfo:'350877-.pdf' },
  { id:'t5', code:'246297', title:'VITROVEN SHANCAYAN-JENN',  worker:'HERNAN', priority:8, status:'blocked',                             fileInfo:'626335-C.pdf' },
  { id:'t6', code:'416508', title:'SERIE 25 - JENNI',         worker:'HERNAN', priority:8, status:'blocked',                             fileInfo:'Archivos' },
  { id:'t7',              title:'SERIE 42 - CAMI',          worker:'MAGNO',  priority:2, status:'not-started', startDate:'26/06/2026', endDate:'29/06/2026', fileInfo:'Archivos' },
  { id:'t8', code:'346336', title:'MAMPARA TEMPLADO - JENN',  worker:'PEDRO',  priority:3, status:'not-started',                         fileInfo:'Archivos' },
  { id:'t9',  title:'', worker:'', priority:0, status:'not-started', fileInfo:'' },
  { id:'t10', title:'', worker:'', priority:0, status:'not-started', fileInfo:'' },
  { id:'t11', title:'', worker:'', priority:0, status:'not-started', fileInfo:'' },
];

@Injectable({ providedIn: 'root' })
export class WorkshopStore {
  readonly stages: KanbanStage[] = [
    { key: 'queue',    label: 'EN COLA / PENDIENTE', color: '#f59e0b' },
    { key: 'cutting',  label: 'CORTE & PULIDO',       color: '#3b82f6' },
    { key: 'assembly', label: 'ARMADO / TEMPLADO',    color: '#8b5cf6' },
    { key: 'qc',       label: 'CONTROL DE CALIDAD',   color: '#f97316' },
    { key: 'dispatch', label: 'LISTO PARA DESPACHO',  color: '#22c55e' },
  ];

  readonly ganttDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  readonly workers   = ['HERNAN', 'PEDRO', 'MAYCOL', 'PERO', 'MAGNO', 'CARLOS', 'JUAN'];

  readonly workOrders  = signal<WorkOrder[]>(MOCK_ORDERS);
  readonly sprintTasks = signal<SprintTask[]>(MOCK_TASKS);

  readonly totalOrders         = computed(() => this.workOrders().length);
  readonly inProcessCount      = computed(() => this.workOrders().filter(o => o.status === 'in-process' || o.status === 'finishing').length);
  readonly completedCount      = computed(() => this.workOrders().filter(o => o.status === 'completed').length);
  readonly delayedCount        = computed(() => this.workOrders().filter(o => o.status === 'delayed').length);
  readonly totalTasks          = computed(() => this.sprintTasks().filter(t => !!t.title).length);
  readonly blockedCount        = computed(() => this.sprintTasks().filter(t => t.status === 'blocked').length);
  readonly inProgressTaskCount = computed(() => this.sprintTasks().filter(t => t.status === 'in-progress').length);

  getOrdersByStage(stage: WorkOrderStage): WorkOrder[] {
    return this.workOrders().filter(o => o.stage === stage);
  }

  addWorkOrder(partial: Partial<WorkOrder> & { clientName: string; productDesc: string }): void {
    const nextNum = 9400 + this.workOrders().length;
    const order: WorkOrder = {
      id:          `o${Date.now()}`,
      orderId:     `#ORD-${nextNum}`,
      timeLabel:   'Ahora',
      status:      'queue',
      stage:       partial.stage  ?? 'queue',
      clientName:  partial.clientName,
      productDesc: partial.productDesc,
      progressPct: 0,
      worker:      partial.worker ?? '',
    };
    this.workOrders.update(list => [order, ...list]);
  }

  addSprintTask(partial: Partial<SprintTask> & { title: string }): void {
    const task: SprintTask = {
      id:        `t${Date.now()}`,
      code:      partial.code,
      title:     partial.title,
      worker:    partial.worker   ?? '',
      priority:  partial.priority ?? 3,
      status:    partial.status   ?? 'not-started',
      startDate: partial.startDate,
      endDate:   partial.endDate,
      fileInfo:  'Archivos'
    };
    this.sprintTasks.update(list => {
      const real   = list.filter(t => !!t.title);
      const blanks = list.filter(t => !t.title);
      return [...real, task, ...blanks];
    });
  }
}
