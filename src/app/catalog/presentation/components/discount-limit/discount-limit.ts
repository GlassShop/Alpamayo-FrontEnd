import {Component, effect, inject, OnInit, signal} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {TranslatePipe} from '@ngx-translate/core';
import {SaleSettingsStore} from '../../../application/sale-settings.store';

/**
 * The most sellers may lower a catalog price on a quote line, set by the CEO
 * while editing prices. Empty means no discount at all.
 */
@Component({
  selector: 'app-discount-limit',
  imports: [MatIconModule, TranslatePipe],
  templateUrl: './discount-limit.html',
  styleUrl: './discount-limit.css'
})
export class DiscountLimit implements OnInit {
  readonly settings = inject(SaleSettingsStore);
  readonly draft = signal('');

  constructor() {
    // Show the saved value whenever it arrives or changes.
    effect(() => {
      const max = this.settings.maxDiscountPercent();
      this.draft.set(max === null ? '' : String(max));
    });
  }

  ngOnInit(): void { this.settings.ensureLoaded(); }

  onInput(event: Event): void { this.draft.set((event.target as HTMLInputElement).value); }

  save(): void {
    const text = this.draft().trim();
    this.settings.setMaxDiscount(text === '' ? null : Number(text));
  }

  clear(): void {
    this.draft.set('');
    this.settings.setMaxDiscount(null);
  }
}
