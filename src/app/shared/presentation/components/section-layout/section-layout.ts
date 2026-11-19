import {Component, computed, inject, InjectionToken, Signal} from '@angular/core';
import {ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {MatIconModule} from '@angular/material/icon';
import {TranslatePipe} from '@ngx-translate/core';
import {IamStore} from '../../../../iam/application/iam.store';
import {Permission} from '../../../../iam/domain/model/permission';

/** One page of a menu section, shown as a tab above it. */
export interface SectionTab {
  link: string;
  labelKey: string;
  icon: string;
  /** Hidden for users without it; the route itself is still guarded. */
  permission?: Permission;
}

/**
 * Optional numbers shown next to a tab, by its link (e.g. purchases waiting
 * for their costs). The section that has them provides this token.
 */
export const SECTION_BADGES = new InjectionToken<Readonly<Record<string, Signal<number | null>>>>('SECTION_BADGES');

/**
 * Groups related pages under one menu entry: a row of links to each page of
 * the section (from the route's `data.tabs`, named by `data.labelKey`) above the active page. With a
 * single page left for the user's role, the row is not shown.
 */
@Component({
  selector: 'app-section-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, MatIconModule, TranslatePipe],
  template: `
    @if (tabs().length > 1) {
      <nav class="sl-tabs" [attr.aria-label]="labelKey | translate">
        @for (tab of tabs(); track tab.link; let first = $first) {
          <a class="sl-tab" [routerLink]="tab.link" routerLinkActive="sl-tab--active" #rla="routerLinkActive"
             [routerLinkActiveOptions]="{exact: first}" [attr.aria-current]="rla.isActive ? 'page' : null">
            <mat-icon>{{ tab.icon }}</mat-icon>{{ tab.labelKey | translate }}
            @if (badges?.[tab.link]?.(); as count) { <span class="sl-badge">{{ count }}</span> }
          </a>
        }
      </nav>
    }
    <router-outlet/>
  `,
  styles: `
    :host { display: block; }
    .sl-tabs { display: flex; gap: 4px; margin: -8px 0 20px; border-bottom: 1px solid var(--al-divider); overflow-x: auto; }
    .sl-tab {
      display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; margin-bottom: -1px;
      border-bottom: 3px solid transparent; color: var(--al-text-muted); font-weight: 600; font-size: .9rem;
      text-decoration: none; white-space: nowrap;
    }
    .sl-tab mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .sl-tab:hover { color: var(--al-text); }
    .sl-tab:focus-visible { outline: 2px solid var(--al-primary); outline-offset: -2px; border-radius: var(--al-radius); }
    .sl-tab--active { color: var(--al-primary); border-bottom-color: var(--al-primary); }
    .sl-badge {
      min-width: 20px; padding: 1px 6px; border-radius: 999px; background: var(--al-primary); color: #fff;
      font-size: .72rem; font-weight: 700; text-align: center;
    }
  `
})
export class SectionLayout {
  private readonly iam = inject(IamStore);
  private readonly data = inject(ActivatedRoute).snapshot.data;
  private readonly allTabs: readonly SectionTab[] = this.data['tabs'] ?? [];
  readonly labelKey: string = this.data['labelKey'] ?? '';
  readonly badges = inject(SECTION_BADGES, {optional: true});

  readonly tabs = computed(() => {
    this.iam.currentUser(); // re-evaluate when the user changes
    return this.allTabs.filter(t => !t.permission || this.iam.can(t.permission));
  });
}
