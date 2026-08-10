import {Component} from '@angular/core';
import {FeaturePlaceholder} from '../../../../shared/presentation/components/feature-placeholder/feature-placeholder';
@Component({ selector: 'app-quotes-list', imports: [FeaturePlaceholder], template: `<app-feature-placeholder icon="description" titleKey="sellers.quotes.title" descriptionKey="sellers.placeholder.content"/>` })
export class QuotesList {}
