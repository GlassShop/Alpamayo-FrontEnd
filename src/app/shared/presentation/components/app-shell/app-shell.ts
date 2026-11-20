import {Component, inject, signal} from '@angular/core';
import {Router, RouterOutlet} from '@angular/router';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatTooltipModule} from '@angular/material/tooltip';
import {AppSidebar} from '../app-sidebar/app-sidebar';

/** Application frame: side navigation, top bar and routed content. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, MatIconModule, MatButtonModule, MatTooltipModule, AppSidebar],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.css'
})
export class AppShell {
  private readonly router = inject(Router);
  readonly collapsed = signal(false);

  toggleSidebar(): void { this.collapsed.update(v => !v); }
  openConfiguration(): void { this.router.navigate(['/configuracion']); }
}
