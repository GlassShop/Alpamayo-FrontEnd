import {Component, computed, inject, Input} from '@angular/core';
import {Router, RouterLink, RouterLinkActive} from '@angular/router';
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
  /** Highlight only on an exact URL match (e.g. /catalogo vs /catalogo/precios). */
  exact?: boolean;
}

/** Every section of the app; each user only sees the ones their role allows. */
const NAV_OPTIONS: readonly NavOption[] = [
  {link: '/cotizador',        labelKey: 'nav.quote',    icon: 'calculate',    permission: 'quote'},
  {link: '/cotizaciones',     labelKey: 'nav.quotes',   icon: 'description',  permission: 'quote'},
  {link: '/catalogo',         labelKey: 'nav.catalog',  icon: 'window',       permission: 'catalog.view', exact: true},
  {link: '/catalogo/precios', labelKey: 'nav.prices',   icon: 'price_change', permission: 'prices.manage'},
  {link: '/usuarios',         labelKey: 'nav.users',    icon: 'group',        permission: 'users.manage'},
  {link: '/configuracion',    labelKey: 'nav.settings', icon: 'settings',     permission: 'settings'},
];

/** Side navigation with the sections allowed for the signed-in user's role. */
@Component({
  selector: 'app-seller-sidebar',
  imports: [RouterLink, RouterLinkActive, MatIconModule, MatTooltipModule, TranslatePipe],
  templateUrl: './seller-sidebar.html',
  styleUrl: './seller-sidebar.css',
  host: {'[class.sidebar-collapsed]': 'collapsed'}
})
export class SellerSidebar {
  @Input() collapsed = false;

  readonly iamStore = inject(IamStore);
  private readonly router = inject(Router);

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

  signOut(): void {
    this.iamStore.signOut();
  }
}
