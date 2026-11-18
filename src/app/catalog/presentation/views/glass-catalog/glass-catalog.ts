import {Component, inject, OnInit} from '@angular/core';
import {DecimalPipe} from '@angular/common';
import {RouterLink} from '@angular/router';
import {MatIconModule} from '@angular/material/icon';
import {TranslatePipe} from '@ngx-translate/core';
import {CatalogStore} from '../../../application/catalog.store';

/** Read-only catalog: every role sees glass types and their price per list. */
@Component({
  selector: 'app-glass-catalog',
  imports: [DecimalPipe, RouterLink, TranslatePipe, MatIconModule],
  templateUrl: './glass-catalog.html',
  styleUrl: './glass-catalog.css'
})
export class GlassCatalog implements OnInit {
  readonly catalog = inject(CatalogStore);

  ngOnInit(): void { this.catalog.ensureLoaded(); }

  /** How many price lists still have no price for this glass type. */
  missingPrices(glassTypeId: number): number {
    return this.catalog.priceLists().filter(l => this.catalog.priceFor(glassTypeId, l.id) === null).length;
  }
}
