import {Component} from '@angular/core';
import {FeaturePlaceholder} from '../../../../shared/presentation/components/feature-placeholder/feature-placeholder';

@Component({
  selector: 'app-direct-sales',
  imports: [FeaturePlaceholder],
  template: `<app-feature-placeholder icon="inventory_2" titleKey="sellers.sales.title" descriptionKey="sellers.placeholder.content"/>`
})
export class DirectSales {}
