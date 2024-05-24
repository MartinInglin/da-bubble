import { Injectable, inject } from '@angular/core';
import { FirebaseApp } from '@angular/fire/app';
import {
  Auth,
  GoogleAuthProvider,
  UserCredential,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  getAdditionalUserInfo,
  getAuth,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
  user,
} from '@angular/fire/auth';
import { Router } from '@angular/router';
import { RegistrationService } from './registration.service';
import { SnackbarService } from './snackbar.service';
import { UsersService } from './firestore/users.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth: Auth;
  private router = inject(Router);
  usersService = inject(UsersService);
  registrationService = inject(RegistrationService);
  snackbarService = inject(SnackbarService);

  constructor() {
    this.auth = getAuth();
  }

  /**
   * This function is for the registration process of the user. It firstly creates a user in firebase auth and then calls for creating a user in the firestore. If successful it navigates the user to the login page.
   *
   * @returns Starts creating a user in firestore.
   */
  signUp(): Promise<void> {
    const userData = this.registrationService.getUserData();

    return (
      createUserWithEmailAndPassword(
        this.auth,
        userData.email,
        userData.password
      )
        //exchange after testing from here to Line 70
        .then((userCredential) => {
          if (userCredential.user) {
            const id = userCredential.user.uid;
            return this.usersService.createUser(id).then(() => {
              this.router.navigate(['/login']);
              this.snackbarService.openSnackBar(
                'User successfully created. Please log in.',
                'Close'
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
              'This email address is already in use. Please log in.',
              'Close'
            );
          } else {
            this.snackbarService.openSnackBar(
              'Error during sign up: ' + error.message,
              'Close'
            );
          }
        })
    );

    // .then((userCredential) => {
    //   if (userCredential.user) {
    //     return sendEmailVerification(userCredential.user)
    //       .then(() => {
    //         const id = userCredential.user.uid;
    //         return this.usersService.createUser(id);
    //       })
    //       .then(() => {
    //         this.router.navigate(['/login']);
    //         this.snackbarService.openSnackBar(
    //           'Bestätigungs-E-Mail gesendet. Bitte überprüfe deine Mailbox.',
    //           'Schliessen'
    //         );
    //       });
    //   } else {
    //     throw new Error('No user credential found');
    //   }
    // })
    // .catch((error) => {
    //   console.error('Error during sign up:', error);
    //   if (error.code === 'auth/email-already-in-use') {
    //     this.snackbarService.openSnackBar(
    //       'Diese Mailadresse besteht bereits. Bitte melde dich an.',
    //       'Schliessen'
    //     );
    //   } else {
    //     this.snackbarService.openSnackBar(
    //       'Error during sign up: ' + error.message,
    //       'Close'
    //     );
    //   }
    // });
  }

  /**
   * This function is there to sign in the user. It then navigates the user to the landing page.
   *
   * @param email string
   * @param password string
   * @returns Calls the fire auth function to sign in with email and password.
   */
  signInWithEmail(email: string, password: string): Promise<void> {
    return this.auth.setPersistence(browserSessionPersistence).then(() => {
      return signInWithEmailAndPassword(this.auth, email, password)
        .then((userCredential) => {
          this.signIn(userCredential);
        })
        .catch((error) => {
          this.snackbarService.openSnackBar(
            'Passwort und / oder E-Mail-Adresse stimmen nicht überein.',
            'Schliessen'
          );
        });
    });
  }

  signInByGoogle(): Promise<void> {
    return signInWithPopup(this.auth, new GoogleAuthProvider())
      .then((result: UserCredential) => {
        const user = result.user;
        if (user) {
          const userId = user.uid;
          const additionalUserInfo = getAdditionalUserInfo(result);

          if (additionalUserInfo?.isNewUser) {
            this.usersService.createUserGoogle(result);
          }
          this.signIn(result);
        }
      })
      .catch((error) => {
        console.error('Error during Google sign-in:', error);
      });
  }

  signInGuestUser() {
    const email: string = 'a@b.ch';
    const password: string = 'afopsdnv230lsdksofj_12gerte';
    console.log('Guest signed in');

    this.signInWithEmail(email, password);
  }

  signIn(userCredential: UserCredential) {
    const userSignedIn = userCredential.user;
    const userId = userCredential.user.uid;

    //exchange after testing from here to line 117
    this.usersService.getCurrentUser(userId);
    this.router.navigate(['/landingPage']);

    // if (userSignedIn.emailVerified) {
    //   this.usersService.getCurrentUser(userId);
    //   this.router.navigate(['landingPage']);
    // } else {
    //   this.snackbarService.openSnackBar(
    //     'Bitte verifiziere deine E-Mail-Adresse, bevor du dich anmeldest.',
    //     'Schliessen'
    //   );
    //   this.auth.signOut();
    // }
  }

  /**
   * This function signs out the user. If successful it navigates the user to the login page.
   *
   * @returns Calls the signOut function of fire auth.
   */
  signOut() {
    return signOut(this.auth)
      .then(() => {
        sessionStorage.removeItem('currentUser');
        this.router.navigate(['/login']);
      })
      .catch((error) => {
        this.snackbarService.openSnackBar(
          'Logout hat nicht geklappt. Versuche es erneut.',
          'Schliessen'
        );
      });
  }

  resetForgottenPassword(email: string) {
    sendPasswordResetEmail(this.auth, email)
      .then(() => {
        this.snackbarService.openSnackBar(
          'Wir haben dir eine Email zum Zurücksetzen des Passwortes gesendet. Bitte überprüfe auch deinen Spam-Ordner.',
          'Schliessen'
        );
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        // ..
      });
  }

  changePassword(password: string) {
    const currentUser = this.auth.currentUser;

    if (currentUser) {
      updatePassword(currentUser, password)
        .then(() => {
          this.snackbarService.openSnackBar(
            'Deine neues Passwort wurde gespeichert.',
            'Schliessen'
          );
        })
        .catch((error) => {
          console.log(error);
          this.snackbarService.openSnackBar(
            'Etwas ist leider schief gelaufen. Bitte versuche es noch einmal oder wende dich an den Support.',
            'Schliessen'
          );
        });
    }
  }

  async verifyPassword(email: string, password: string): Promise<boolean> {
    try {
      await signInWithEmailAndPassword(this.auth, email, password);
      return true;
    } catch (error) {
      return false;
    }
  }

}

