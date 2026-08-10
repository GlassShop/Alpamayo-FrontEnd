import {Component, signal} from '@angular/core';
import {RouterOutlet} from '@angular/router';
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
  readonly collapsed = signal(false);
  toggleSidebar(): void { this.collapsed.update(v => !v); }
}

