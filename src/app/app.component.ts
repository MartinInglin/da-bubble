import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LandingPageComponent } from './components/landing-page/landing-page.component';
import { HeaderComponent } from './components/shared/header/header.component';
import { ScrollDownService } from './services/scroll-down.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, LandingPageComponent],

  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  scrollDownSevice = inject(ScrollDownService);

  title = 'da-bubble';

  scrollToBottomChannel() {
    this.scrollDownSevice.scrollDownChannel();
  }

  scrollToBottomDirectMessage() {
    this.scrollDownSevice.scrollDownDirectMessage();
  }
}
