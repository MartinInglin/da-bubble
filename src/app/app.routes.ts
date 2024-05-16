import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { ProfileDetailViewComponent } from './components/profile-detail-view/profile-detail-view.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'detailView', component: ProfileDetailViewComponent },
];
