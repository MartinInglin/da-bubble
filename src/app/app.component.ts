import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AddUserToChannelComponent } from './components/add-user-to-channel/add-user-to-channel.component';
import { ProfileDetailViewComponent } from './components/profile-detail-view/profile-detail-view.component';
import { NewChannelComponent } from './components/new-channel/new-channel.component';
import { HeaderComponent } from './components/shared/header/header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, ProfileDetailViewComponent, AddUserToChannelComponent, NewChannelComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'da-bubble';
}
