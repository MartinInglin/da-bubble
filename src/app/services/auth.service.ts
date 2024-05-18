import { Injectable, inject } from '@angular/core';
import { FirebaseApp } from '@angular/fire/app';
import {
  Auth,
  createUserWithEmailAndPassword,
  getAuth,
} from '@angular/fire/auth';
import { Router } from '@angular/router';
import { FirebaseService } from './firebase.service';
import { RegistrationService } from './registration.service';
import { SnackbarErrorComponent } from '../components/snackbar-error/snackbar-error.component';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth: Auth;
  private router = inject(Router);
  firebaseService = inject(FirebaseService);
  registrationService = inject(RegistrationService);
  snackbarError = inject(SnackbarErrorComponent)

  constructor(private afApp: FirebaseApp) {
    this.auth = getAuth(afApp);
  }

  signUp(): Promise<void> {
    const userData = this.registrationService.getUserData();

    return createUserWithEmailAndPassword(
      this.auth,
      userData.email,
      userData.password
    )
      .then((userCredential) => {
        const id = userCredential.user.uid;
        return this.firebaseService.createUser(id);
      })
      .then(() => {
        this.router.navigate(['/login']);
      })
      .catch((error) => {
        console.error('Error during sign up:', error);
        this.snackbarError.openSnackBar('Diese Mailadresse besteht bereits. Bitte melde dich an.', 'Schliessen');
      });
  }
}
