import {Component} from '@angular/core';
import {FeaturePlaceholder} from '../../../../shared/presentation/components/feature-placeholder/feature-placeholder';
@Component({ selector: 'app-cash-register', imports: [FeaturePlaceholder], template: `<app-feature-placeholder icon="payments" titleKey="sellers.cash.title" descriptionKey="sellers.placeholder.content"/>` })
export class CashRegister {}
