import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from './shared/toast-container.component';
import { DialogoContainerComponent } from './shared/dialogo-container.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainerComponent, DialogoContainerComponent],
  template:
    '<router-outlet /><app-toast-container /><app-dialogo-container />',
})
export class App {}
