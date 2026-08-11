import {Component, Input, signal, inject, OnInit} from '@angular/core';
import {Router, RouterLink, RouterLinkActive, NavigationEnd} from '@angular/router';
import {filter} from 'rxjs/operators';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';

export interface SubNavOption { link: string; label: string; icon: string; }
export interface NavOption {
  link?: string;
  key?: string;
  label: string;
  icon: string;
  children?: SubNavOption[];
}

@Component({
  selector: 'app-seller-sidebar',
  imports: [RouterLink, RouterLinkActive, MatIconModule, MatTooltipModule],
  templateUrl: './seller-sidebar.html',
  styleUrl: './seller-sidebar.css',
  host: {'[class.sidebar-collapsed]': 'collapsed'}
})
export class SellerSidebar implements OnInit {
  @Input() collapsed = false;

  private readonly router = inject(Router);

  expandedKeys = signal<Set<string>>(new Set());

  options = signal<NavOption[]>([
    { link: '/sellers/dashboard',   label: 'Dashboard Ventas',     icon: 'space_dashboard' },
    { link: '/sellers/quoting/new', label: 'Proyectos & Cotizador', icon: 'calculate' },
    {
      key: 'quotes', label: 'Ventas & CRM', icon: 'group',
      children: [
        { link: '/sellers/quotes/productos',    label: 'Productos',                        icon: 'inventory_2' },
        { link: '/sellers/quotes/cotizaciones', label: 'Mis Cotizaciones & Proformas PDF', icon: 'receipt_long' },
        { link: '/sellers/quotes/adelantos',    label: 'Registro de Adelantos',            icon: 'payments' },
      ]
    },
    {
      key: 'workshop', label: 'Taller de Producción', icon: 'precision_manufacturing',
      children: [
        { link: '/sellers/workshop/estado-taller', label: 'Estado de Taller',    icon: 'view_kanban' },
        { link: '/sellers/workshop/sprint',         label: 'Sprint de Proyectos', icon: 'table_chart' },
      ]
    },
    { link: '/sellers/agenda',  label: 'Agenda & Visitas',  icon: 'calendar_month' },
    { link: '/sellers/sales',   label: 'Stock & Retazos',   icon: 'inventory_2' },
    { link: '/sellers/profile', label: 'Mi Perfil & Metas', icon: 'manage_accounts' }
  ]);

  ngOnInit(): void {
    this.checkAndExpand(this.router.url);
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => this.checkAndExpand(e.urlAfterRedirects));
  }

  private checkAndExpand(url: string): void {
    for (const opt of this.options()) {
      if (opt.key && opt.children?.some(c => url.startsWith(c.link))) {
        this.expandedKeys.update(s => { const n = new Set(s); n.add(opt.key!); return n; });
      }
    }
  }

  toggleExpand(key: string): void {
    this.expandedKeys.update(s => {
      const n = new Set(s);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });
  }

  isExpanded(key: string): boolean { return this.expandedKeys().has(key); }

  isChildActive(children: SubNavOption[]): boolean {
    return children.some(c => this.router.url.startsWith(c.link));
  }

  onParentClick(option: NavOption): void {
    if (this.collapsed) {
      if (option.children?.[0]) this.router.navigate([option.children[0].link]);
    } else {
      if (option.key) this.toggleExpand(option.key);
    }
  }
}

