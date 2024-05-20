import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { ProfileDetailViewComponent } from './components/profile-detail-view/profile-detail-view.component';
import { AddUserToChannelComponent } from './components/add-user-to-channel/add-user-to-channel.component';
import { AddUserToNewChannelComponent } from './components/add-user-to-new-channel/add-user-to-new-channel.component';
import { NewChannelComponent } from './components/new-channel/new-channel.component';
import { ChannelInfoComponent } from './components/channel-info/channel-info.component';
import { ChannelInfoEditComponent } from './components/channel-info/channel-info-edit/channel-info-edit.component';
import { MembersComponent } from './components/members/members.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { ChooseAvatarComponent } from './components/choose-avatar/choose-avatar.component';
import { LandingPageComponent } from './components/landing-page/landing-page.component';
import { EditMessageComponent } from './components/edit-message/edit-message.component';
import { UserMenuComponent } from './components/user-menu/user-menu.component';
import { CurrentUserComponent } from './components/current-user/current-user.component';

import { AuthGuard, redirectUnauthorizedTo } from '@angular/fire/auth-guard';


const redirectUnauthorizedToLogin = () => redirectUnauthorizedTo(['/login']);


export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'resetPassword', component: ResetPasswordComponent },
  { path: 'chooseAvatar', component: ChooseAvatarComponent },

  // {
  //   path: '',
  //   component: LandingPageComponent,
  //   canActivate: [AuthGuard],
  //   data: { authGuardPipe: redirectUnauthorizedToLogin },
  // },
  { path: 'detailView', component: ProfileDetailViewComponent },

  { path: 'landingPage', component: LandingPageComponent },


  { path: 'addUserToChannel', component: AddUserToChannelComponent },
  { path: 'addUserToNewChannel', component: AddUserToNewChannelComponent },
  { path: 'newChannel', component: NewChannelComponent },
  { path: 'channelInfo', component: ChannelInfoComponent},
  { path: 'channelInfoEdit', component: ChannelInfoEditComponent},
  { path: 'members', component: MembersComponent},
  { path: 'editMessage', component: EditMessageComponent},
  { path: 'userMenu', component: UserMenuComponent},
  { path: 'currentUser', component: CurrentUserComponent}

];
