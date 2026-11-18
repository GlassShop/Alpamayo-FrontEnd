import {Component, inject} from '@angular/core';
import {RouterLink} from '@angular/router';
import {TranslateModule} from '@ngx-translate/core';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {ConfigurationStore} from '../../../application/configuration.store';

@Component({
  selector: 'app-configuration',
  imports: [
    RouterLink, TranslateModule,
    MatIconModule, MatButtonModule, MatCardModule, MatButtonToggleModule
  ],
  templateUrl: './configuration.html',
  styleUrl: './configuration.css'
})
export class Configuration {
  readonly configStore = inject(ConfigurationStore);

  setLanguage(lang: string): void {
    this.configStore.setLanguage(lang);
  }
}
