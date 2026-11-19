import {Component, ElementRef, inject, input, output} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {TranslatePipe} from '@ngx-translate/core';

export interface TabOption<T extends string> {
  id: T;
  labelKey: string;
  icon: string;
  /** Small number shown next to the label, e.g. items without price. */
  badge?: number | null;
}

/**
 * Row of tabs (ARIA tablist) with arrow-key navigation. The page renders the
 * panel of the active tab and labels it with `tabPanelLabel(id)`.
 */
@Component({
  selector: 'app-tab-bar',
  imports: [MatIconModule, TranslatePipe],
  template: `
    <div class="tb-list" role="tablist" [attr.aria-label]="label()">
      @for (tab of tabs(); track tab.id; let i = $index) {
        <button type="button" role="tab" class="tb-tab" [id]="idPrefix() + '-tab-' + tab.id"
                [class.tb-tab--active]="active() === tab.id"
                [attr.aria-selected]="active() === tab.id"
                [attr.aria-controls]="idPrefix() + '-panel'"
                [attr.tabindex]="active() === tab.id ? 0 : -1"
                (click)="selected.emit(tab.id)" (keydown)="onKey($event, i)">
          <mat-icon>{{ tab.icon }}</mat-icon>{{ tab.labelKey | translate }}
          @if (tab.badge) { <span class="tb-badge">{{ tab.badge }}</span> }
        </button>
      }
    </div>
  `,
  styles: `
    :host { display: block; }
    .tb-list { display: flex; gap: 4px; border-bottom: 1px solid var(--al-divider); overflow-x: auto; }
    .tb-tab {
      display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; margin-bottom: -1px;
      border: 0; border-bottom: 3px solid transparent; background: transparent; cursor: pointer; white-space: nowrap;
      color: var(--al-text-muted); font: inherit; font-size: .9rem; font-weight: 600;
    }
    .tb-tab mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .tb-tab:hover { color: var(--al-text); }
    .tb-tab:focus-visible { outline: 2px solid var(--al-primary); outline-offset: -2px; }
    .tb-tab--active { color: var(--al-primary-strong); border-bottom-color: var(--al-primary); }
    .tb-badge {
      min-width: 20px; padding: 1px 6px; border-radius: 10px; font-size: .7rem; font-weight: 700; text-align: center;
      color: var(--al-warning); background: var(--al-warning-soft);
    }
    @media (max-width: 600px) { .tb-tab { padding: 10px 12px; } }
  `
})
export class TabBar<T extends string> {
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly tabs = input.required<readonly TabOption<T>[]>();
  readonly active = input.required<T>();
  /** Accessible name of the tab list. */
  readonly label = input('');
  /** Prefix for element ids, unique on the page. */
  readonly idPrefix = input('tabs');
  readonly selected = output<T>();

  /** Arrow keys move between tabs, as in any tab list. */
  onKey(event: KeyboardEvent, index: number): void {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const tabs = this.tabs();
    const next = tabs[(index + step + tabs.length) % tabs.length];
    this.selected.emit(next.id);
    queueMicrotask(() => (this.host.nativeElement as HTMLElement).querySelector<HTMLElement>(`#${this.idPrefix()}-tab-${next.id}`)?.focus());
  }
}

/** Id of the panel element the tabs control; put it on the panel with role="tabpanel". */
export function tabPanelId(idPrefix: string): string {
  return `${idPrefix}-panel`;
}
