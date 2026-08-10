import {Component} from '@angular/core';
import {FeaturePlaceholder} from '../../../../shared/presentation/components/feature-placeholder/feature-placeholder';
@Component({ selector: 'app-quoting-new', imports: [FeaturePlaceholder], template: `<app-feature-placeholder icon="calculate" titleKey="sellers.quoting.title" descriptionKey="sellers.placeholder.content"/>` })
export class QuotingNew {}
