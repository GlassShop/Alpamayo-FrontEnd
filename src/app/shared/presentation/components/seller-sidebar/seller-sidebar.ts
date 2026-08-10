import {Component, Input, signal} from '@angular/core';
import {RouterLink, RouterLinkActive} from '@angular/router';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';

@Component({
  selector: 'app-seller-sidebar',
  imports: [RouterLink, RouterLinkActive, MatIconModule, MatTooltipModule],
  templateUrl: './seller-sidebar.html',
  styleUrl: './seller-sidebar.css',
  host: {'[class.sidebar-collapsed]': 'collapsed'}
})
export class SellerSidebar {
  @Input() collapsed = false;
  options = signal([
    {link: '/sellers/dashboard',   label: 'Dashboard Ventas',      icon: 'space_dashboard'},
    {link: '/sellers/quoting/new', label: 'Proyectos & Cotizador',  icon: 'calculate'},
    {link: '/sellers/quotes',      label: 'Ventas & CRM',           icon: 'group'},
    {link: '/sellers/orders',      label: 'Estado de Taller',       icon: 'precision_manufacturing'},
    {link: '/sellers/agenda',      label: 'Agenda & Visitas',       icon: 'calendar_month'},
    {link: '/sellers/sales',       label: 'Stock & Retazos',        icon: 'inventory_2'},
    {link: '/sellers/profile',     label: 'Mi Perfil & Metas',      icon: 'manage_accounts'}
  ]);
}

