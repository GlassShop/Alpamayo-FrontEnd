import {Component, inject, signal} from '@angular/core';
import {Layout} from './shared/presentation/components/layout/layout';
import {ConfigurationStore} from './sellers/application/configuration.store';

@Component({
  selector: 'app-root',
  imports: [Layout],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Vidrieria Alpamayo');

  constructor() {
    inject(ConfigurationStore);
  }
}
