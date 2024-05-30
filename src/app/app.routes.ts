import { Routes } from '@angular/router';
import { LoginComponent } from './components/login-registration/login/login.component';
import { RegisterComponent } from './components/login-registration/register/register.component';
import { ResetPasswordComponent } from './components/login-registration/reset-password/reset-password.component';
import { ChooseAvatarComponent } from './components/login-registration/choose-avatar/choose-avatar.component';

import { ImprintComponent } from './components/legal/imprint/imprint.component';
import { PrivacyPolicyComponent } from './components/legal/privacy-policy/privacy-policy.component';

import { ProfileDetailViewComponent } from './components/profile-detail-view/profile-detail-view.component';
import { AddUserToChannelComponent } from './components/add-user-to-channel/add-user-to-channel.component';
import { AddUserToNewChannelComponent } from './components/add-user-to-new-channel/add-user-to-new-channel.component';
import { NewChannelComponent } from './components/new-channel/new-channel.component';
import { ChannelInfoComponent } from './components/channel-info/channel-info.component';
import { ChannelInfoEditComponent } from './components/channel-info/channel-info-edit/channel-info-edit.component';
import { MembersComponent } from './components/members/members.component';

import { LandingPageComponent } from './components/landing-page/landing-page.component';
import { EditMessageComponent } from './components/edit-message/edit-message.component';
import { UserMenuComponent } from './components/user-menu/user-menu.component';
import { CurrentUserComponent } from './components/current-user/current-user.component';

import {
  AuthGuard,
  redirectLoggedInTo,
  redirectUnauthorizedTo,
} from '@angular/fire/auth-guard';

const redirectSignedInToLandingPage = () =>
  redirectLoggedInTo(['/landingPage']);
const redirectUnauthorizedToLogin = () => redirectUnauthorizedTo(['/login']);

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  {
    path: 'login',
    component: LoginComponent,
    canActivate: [AuthGuard],
    data: { authGuardPipe: redirectSignedInToLandingPage },
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [AuthGuard],
    data: { authGuardPipe: redirectSignedInToLandingPage },
  },
  {
    path: 'resetPassword',
    component: ResetPasswordComponent,
    canActivate: [AuthGuard],
    data: { authGuardPipe: redirectSignedInToLandingPage },
  },
  {
    path: 'chooseAvatar',
    component: ChooseAvatarComponent,
    canActivate: [AuthGuard],
    data: { authGuardPipe: redirectSignedInToLandingPage },
  },

  { path: 'imprint', component: ImprintComponent },
  { path: 'privacyPolicy', component: PrivacyPolicyComponent },

  {
    path: 'landingPage',
    component: LandingPageComponent,
    canActivate: [AuthGuard],
    data: { authGuardPipe: redirectUnauthorizedToLogin },
  },

  //{ path: 'landingPage', component: LandingPageComponent },

  // { path: 'detailView', component: ProfileDetailViewComponent },

  // { path: 'addUserToChannel', component: AddUserToChannelComponent },
  // { path: 'addUserToNewChannel', component: AddUserToNewChannelComponent },
  // { path: 'newChannel', component: NewChannelComponent },
  // { path: 'channelInfo', component: ChannelInfoComponent },
  // { path: 'channelInfoEdit', component: ChannelInfoEditComponent },
  // { path: 'members', component: MembersComponent },
  // { path: 'editMessage', component: EditMessageComponent },
  // { path: 'userMenu', component: UserMenuComponent },
  // { path: 'currentUser', component: CurrentUserComponent },
];
