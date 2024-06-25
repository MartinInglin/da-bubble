import { Routes } from '@angular/router';
import { LoginComponent } from './components/login-registration/login/login.component';
import { RegisterComponent } from './components/login-registration/register/register.component';
import { ResetPasswordComponent } from './components/login-registration/reset-password/reset-password.component';
import { ChooseAvatarComponent } from './components/login-registration/choose-avatar/choose-avatar.component';
import { ImprintComponent } from './components/legal/imprint/imprint.component';
import { PrivacyPolicyComponent } from './components/legal/privacy-policy/privacy-policy.component';
import { LandingPageComponent } from './components/landing-page/landing-page.component';


import {
  AuthGuard,
  redirectLoggedInTo,
  redirectUnauthorizedTo,
} from '@angular/fire/auth-guard';
import { MainContentComponent } from './components/landing-page/main-content/main-content.component';

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
  {
    path: 'mainContent',
    component: MainContentComponent,
    canActivate: [AuthGuard],
    data: { authGuardPipe: redirectUnauthorizedToLogin },
  }
];
