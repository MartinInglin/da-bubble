import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ProfileDetailViewComponent } from './components/profile-detail-view/profile-detail-view.component';
import { HeaderComponent } from './components/shared/header/header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, ProfileDetailViewComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'da-bubble';
}
