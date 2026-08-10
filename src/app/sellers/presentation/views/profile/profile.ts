import {Component} from '@angular/core';
import {FeaturePlaceholder} from '../../../../shared/presentation/components/feature-placeholder/feature-placeholder';
@Component({ selector: 'app-profile', imports: [FeaturePlaceholder], template: `<app-feature-placeholder icon="manage_accounts" titleKey="sellers.profile.title" descriptionKey="sellers.placeholder.content"/>` })
export class Profile {}
