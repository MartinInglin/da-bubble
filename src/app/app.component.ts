import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { LandingPageComponent } from './components/landing-page/landing-page.component';

import { HeaderComponent } from './components/shared/header/header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    HeaderComponent,
    LandingPageComponent
  ],

  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'da-bubble';
}
