import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from './shared/toast-container.component';
import { DialogoContainerComponent } from './shared/dialogo-container.component';
import { CookieBannerComponent } from './shared/cookie-banner.component';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    ToastContainerComponent,
    DialogoContainerComponent,
    CookieBannerComponent,
  ],
  template:
    '<router-outlet /><app-toast-container /><app-dialogo-container /><app-cookie-banner />',
})
export class App {}
