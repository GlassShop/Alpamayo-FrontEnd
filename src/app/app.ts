import {Component, inject} from '@angular/core';
import {Layout} from './shared/presentation/components/layout/layout';
import {ConfigurationStore} from './shared/application/configuration.store';
import {AppErrorStore} from './shared/application/app-error.store';

@Component({
  selector: 'app-root',
  imports: [Layout],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  readonly appError = inject(AppErrorStore);

  constructor() {
    inject(ConfigurationStore);
  }
}
