import {Component, inject, signal} from '@angular/core';
import {Router, RouterOutlet} from '@angular/router';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatTooltipModule} from '@angular/material/tooltip';
import {SellerSidebar} from '../seller-sidebar/seller-sidebar';

@Component({
  selector: 'app-seller-shell',
  imports: [RouterOutlet, MatIconModule, MatButtonModule, MatTooltipModule, SellerSidebar],
  templateUrl: './seller-shell.html',
  styleUrl: './seller-shell.css'
})
export class SellerShell {
  private readonly router = inject(Router);
  readonly collapsed = signal(false);
  toggleSidebar(): void { this.collapsed.update(v => !v); }
  openConfiguration(): void { this.router.navigate(['/sellers/configuration']); }
}

