import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { ProfileDetailViewComponent } from './components/profile-detail-view/profile-detail-view.component';
import { AddUserToChannelComponent } from './components/add-user-to-channel/add-user-to-channel.component';
import { AddUserToNewChannelComponent } from './components/add-user-to-new-channel/add-user-to-new-channel.component';
import { NewChannelComponent } from './components/new-channel/new-channel.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { ChooseAvatarComponent } from './components/choose-avatar/choose-avatar.component';
import { LandingPageComponent } from './components/landing-page/landing-page.component';


import { AuthGuard, redirectUnauthorizedTo } from '@angular/fire/auth-guard';

const redirectUnauthorizedToLogin = () => redirectUnauthorizedTo(['/login']);


export const routes: Routes = [
  // { path: '', redirectTo: '/login', pathMatch: 'full' },
  // { path: 'login', component: LoginComponent },
  // { path: 'register', component: RegisterComponent },
  // { path: 'resetPassword', component: ResetPasswordComponent },
  // { path: 'chooseAvatar', component: ChooseAvatarComponent },

  // {
  //   path: '',
  //   component: LandingPageComponent,
  //   canActivate: [AuthGuard],
  //   data: { authGuardPipe: redirectUnauthorizedToLogin },
  // },
  { path: 'detailView', component: ProfileDetailViewComponent },

  { path: '', component: LandingPageComponent },


  { path: 'addUserToChannel', component: AddUserToChannelComponent },
  { path: 'addUserToNewChannel', component: AddUserToNewChannelComponent },
  { path: 'newChannel', component: NewChannelComponent },

];
