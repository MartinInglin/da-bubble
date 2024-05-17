import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { ProfileDetailViewComponent } from './components/profile-detail-view/profile-detail-view.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { ChooseAvatarComponent } from './components/choose-avatar/choose-avatar.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'resetPassword', component: ResetPasswordComponent },
  { path: 'chooseAvatar', component: ChooseAvatarComponent },
  { path: 'detailView', component: ProfileDetailViewComponent },
];
