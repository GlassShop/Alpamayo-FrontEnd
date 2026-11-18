import {Component, Input, computed, signal, inject, OnInit} from '@angular/core';
import {Router, RouterLink, RouterLinkActive, NavigationEnd} from '@angular/router';
import {filter} from 'rxjs/operators';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {IamStore} from '../../../../iam/application/iam.store';

export interface SubNavOption { link: string; label: string; icon: string; }
export interface NavOption {
  link?: string;
  key?: string;
  label: string;
  icon: string;
  /** Highlight only on an exact URL match (e.g. /catalogo vs /catalogo/precios). */
  exact?: boolean;
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

  readonly iamStore = inject(IamStore);

  /** Initials of the signed-in user, or a neutral mark when nobody is signed in. */
  readonly userInitials = computed(() =>
    (this.iamStore.currentUsername() ?? '').slice(0, 2).toUpperCase() || '—'
  );

  options = signal<NavOption[]>([
    { link: '/cotizador',        label: 'Cotizador',     icon: 'calculate' },
    { link: '/catalogo',         label: 'Catálogo',      icon: 'window', exact: true },
    { link: '/catalogo/precios', label: 'Precios (CEO)', icon: 'price_change' },
    { link: '/configuracion',    label: 'Configuración', icon: 'settings' }
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

