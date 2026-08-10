import {Component} from '@angular/core';
import {FeaturePlaceholder} from '../../../../shared/presentation/components/feature-placeholder/feature-placeholder';
@Component({ selector: 'app-agenda', imports: [FeaturePlaceholder], template: `<app-feature-placeholder icon="calendar_month" titleKey="sellers.agenda.title" descriptionKey="sellers.placeholder.content"/>` })
export class Agenda {}
