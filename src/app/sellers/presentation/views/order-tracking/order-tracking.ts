import {Component} from '@angular/core';
import {FeaturePlaceholder} from '../../../../shared/presentation/components/feature-placeholder/feature-placeholder';
@Component({ selector: 'app-order-tracking', imports: [FeaturePlaceholder], template: `<app-feature-placeholder icon="precision_manufacturing" titleKey="sellers.orders.title" descriptionKey="sellers.placeholder.content"/>` })
export class OrderTracking {}
