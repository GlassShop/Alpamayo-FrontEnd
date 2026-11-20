import {Component, computed, inject, Input} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {NavigationEnd, Router, RouterLink} from '@angular/router';
import {filter, map} from 'rxjs';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {TranslatePipe} from '@ngx-translate/core';
import {IamStore} from '../../../../iam/application/iam.store';
import {Permission} from '../../../../iam/domain/model/permission';
import {ROLE_LABEL_KEY} from '../../../../iam/domain/model/role';

interface NavOption {
  link: string;
  labelKey: string;
  icon: string;
  /** Permission the signed-in user needs to see the entry. */
  permission: Permission;
  /** Other pages of the same section, which keep the entry highlighted. */
  alsoActiveOn?: readonly string[];
}

/** Every section of the app; each user only sees the ones their role allows. */
const NAV_OPTIONS: readonly NavOption[] = [
  {link: '/cotizador',     labelKey: 'nav.quote',     icon: 'calculate',      permission: 'quote', alsoActiveOn: ['/cotizaciones']},
  {link: '/agenda',        labelKey: 'nav.agenda',    icon: 'calendar_month', permission: 'agenda'},
  {link: '/catalogo',      labelKey: 'nav.catalog',   icon: 'window',         permission: 'catalog.view'},
  {link: '/inventario',    labelKey: 'nav.inventory', icon: 'inventory_2',    permission: 'inventory'},
  {link: '/configuracion', labelKey: 'nav.settings',  icon: 'settings',       permission: 'settings', alsoActiveOn: ['/usuarios']},
];

/** True when `url` is `path` or one of its sub-pages ("/inventario/compras" is under "/inventario"). */
function isUnder(url: string, path: string): boolean {
  const clean = url.split(/[?#]/)[0];
  return clean === path || clean.startsWith(path + '/');
}

/** Side navigation with the sections allowed for the signed-in user's role. */
@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, MatIconModule, MatTooltipModule, TranslatePipe],
  templateUrl: './app-sidebar.html',
  styleUrl: './app-sidebar.css',
  host: {'[class.sidebar-collapsed]': 'collapsed'}
})
export class AppSidebar {
  @Input() collapsed = false;

  readonly iamStore = inject(IamStore);
  private readonly router = inject(Router);

  private readonly url = toSignal(
    this.router.events.pipe(filter(e => e instanceof NavigationEnd), map(e => e.urlAfterRedirects)),
    {initialValue: this.router.url});

  readonly options = computed(() => {
    this.iamStore.currentUser(); // re-evaluate when the user changes
    return NAV_OPTIONS.filter(o => this.iamStore.can(o.permission));
  });

  readonly roleKey = computed(() => {
    const role = this.iamStore.currentUser()?.role;
    return role ? ROLE_LABEL_KEY[role] : 'nav.no-session';
  });

  /** Initials of the signed-in user ("María Ruiz" → "MR"). */
  readonly userInitials = computed(() => {
    const words = (this.iamStore.currentUsername() ?? '').trim().split(/\s+/).filter(Boolean);
    return (words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? '').slice(0, 2)).toUpperCase() || '—';
  });

  isActive(option: NavOption): boolean {
    const url = this.url();
    return [option.link, ...(option.alsoActiveOn ?? [])].some(path => isUnder(url, path));
  }

  signOut(): void {
    this.iamStore.signOut();
  }
}
