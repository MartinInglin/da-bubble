import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
<<<<<<< HEAD
import { LandingPageComponent } from './components/landing-page/landing-page.component';
=======
import { HeaderComponent } from './components/shared/header/header.component';
import { AddUserToChannelComponent } from './components/add-user-to-channel/add-user-to-channel.component';
import { ProfileDetailViewComponent } from './components/profile-detail-view/profile-detail-view.component';
import { NewChannelComponent } from './components/new-channel/new-channel.component';
import { AddUserToNewChannelComponent } from './components/add-user-to-new-channel/add-user-to-new-channel.component';

>>>>>>> fcf84ba240705653e58adf5d90dd54272f69a06c

@Component({
  selector: 'app-root',
  standalone: true,
<<<<<<< HEAD
  imports: [RouterOutlet, LandingPageComponent],
=======
  imports: [RouterOutlet, HeaderComponent, ProfileDetailViewComponent, AddUserToChannelComponent, NewChannelComponent, AddUserToNewChannelComponent],
>>>>>>> fcf84ba240705653e58adf5d90dd54272f69a06c
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'da-bubble';
}
