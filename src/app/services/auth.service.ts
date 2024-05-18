import { Injectable, inject } from '@angular/core';
import { FirebaseApp } from '@angular/fire/app';
import {
  Auth,
  createUserWithEmailAndPassword,
  getAuth,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  user,
} from '@angular/fire/auth';
import { Router } from '@angular/router';
import { FirebaseService } from './firebase.service';
import { RegistrationService } from './registration.service';
import { SnackbarService } from './snackbar.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth: Auth;
  private router = inject(Router);
  firebaseService = inject(FirebaseService);
  registrationService = inject(RegistrationService);
  snackbarService = inject(SnackbarService);

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
        if (userCredential.user) {
          return sendEmailVerification(userCredential.user)
            .then(() => {
              const id = userCredential.user.uid;
              return this.firebaseService.createUser(id);
            })
            .then(() => {
              this.router.navigate(['/login']);
              this.snackbarService.openSnackBar(
                'Bestätigungs-E-Mail gesendet. Bitte überprüfe deine Mailbox.',
                'Schliessen'
              );
            });
        } else {
          throw new Error('No user credential found');
        }
      })
      .catch((error) => {
        console.error('Error during sign up:', error);
        if (error.code === 'auth/email-already-in-use') {
          this.snackbarService.openSnackBar(
            'Diese Mailadresse besteht bereits. Bitte melde dich an.',
            'Schliessen'
          );
        } else {
          this.snackbarService.openSnackBar(
            'Error during sign up: ' + error.message,
            'Close'
          );
        }
      });
  }

  signIn(email: string, password: string): Promise<void> {
    return signInWithEmailAndPassword(this.auth, email, password)
      .then((userCredential) => {
        const userSignedIn = userCredential.user;

        if (userSignedIn.emailVerified) {
          // Email is verified, proceed to landing page
          this.router.navigate(['landingPage']);
        } else {
          // Email is not verified, show a snackbar message
          this.snackbarService.openSnackBar(
            'Bitte verifiziere deine E-Mail-Adresse, bevor du dich anmeldest.',
            'Schliessen'
          );
          // Optionally, you can sign out the user to prevent further actions
          this.auth.signOut();
        }
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        this.snackbarService.openSnackBar(
          'Passwort und / oder E-Mail-Adresse stimmen nicht überein.',
          'Schliessen'
        );
      });
  }

  signOut() {
    return signOut(this.auth)
      .then(() => {
        this.router.navigate(['login']);
      })
      .catch((error) => {
        this.snackbarService.openSnackBar(
          'Logout hat nicht geklappt. Versuche es erneut.',
          'Schliessen'
        );
      });
  }
}
