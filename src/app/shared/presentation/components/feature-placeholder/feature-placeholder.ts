import {Component, Input} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {TranslatePipe} from '@ngx-translate/core';

@Component({
  selector: 'app-feature-placeholder',
  imports: [MatIconModule, TranslatePipe],
  templateUrl: './feature-placeholder.html',
  styleUrl: './feature-placeholder.css'
})
export class FeaturePlaceholder {
  @Input() icon = 'construction';
  @Input() titleKey = 'shared.placeholder.title';
  @Input() descriptionKey = 'shared.placeholder.content';
}

