import { Injectable, inject } from '@angular/core';
import { FirebaseApp } from '@angular/fire/app';
import {
  Auth,
  EmailAuthProvider,
  GoogleAuthProvider,
  UserCredential,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  getAdditionalUserInfo,
  getAuth,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
  verifyBeforeUpdateEmail,
} from '@angular/fire/auth';
import { Router } from '@angular/router';
import { RegistrationService } from './registration.service';
import { SnackbarService } from './snackbar.service';
import { UsersService } from './firestore/users.service';
import { Observable, Subscription, map } from 'rxjs';
import { Firestore, doc, updateDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth: Auth;

  private authSubscription: Subscription | null = null;
  private userCredential: UserCredential | null = null;

  private router = inject(Router);
  firestore = inject(Firestore);
  usersService = inject(UsersService);
  registrationService = inject(RegistrationService);
  snackbarService = inject(SnackbarService);

  constructor(private afApp: FirebaseApp) {
    this.auth = getAuth(afApp);
  }

  /**
   * This function is for the registration process of the user. It firstly creates a user on firebase authentication with email and password.
   *
   * @returns Starts creating a user on firebase.
   */
  signUp(): Promise<void> {
    const userData = this.registrationService.getUserData();

    return createUserWithEmailAndPassword(
      this.auth,
      userData.email,
      userData.password
    )
      .then((userCredential) => this.handleUserCredential(userCredential))
      .catch((error) => this.handleSignUpError(error));
  }

  /**
   * This function starts a couple of functions for the registration process.
   *
   * @param userCredential object of type user credential (firebase)
   * @returns email verifiecation
   */
  private handleUserCredential(userCredential: UserCredential): Promise<void> {
    if (userCredential.user) {
      return sendEmailVerification(userCredential.user)
        .then(() => this.createUser(userCredential.user.uid))
        .then(() => this.postSignUpActions(userCredential.user.uid))
        .catch((error) => this.handleSignUpError(error));
    } else {
      return Promise.reject(new Error('No user credential found'));
    }
  }

  /**
   * This function calls the createUser function in the users service, where a new user is created on firestore.
   *
   * @param userId string
   * @returns
   */
  private createUser(userId: string): Promise<void> {
    return this.usersService.createUser(userId);
  }

  /**
   * This function makes sure that the user is not signed in after registration. Then it navigates her to the login page.
   *
   * @param userId
   */
  private postSignUpActions(userId: string): void {
    this.signOut(userId);
    this.router.navigate(['/login']);
    this.snackbarService.openSnackBar(
      'Bestätigungs-E-Mail gesendet. Bitte überprüfe deine Mailbox.',
      'Schliessen'
    );
  }

  /**
   * This function handles all sign up errors.
   *
   * @param error type any
   */
  private handleSignUpError(error: any): void {
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
  }

  /**
   * This function is there to sign in the user.
   *
   * @param email string
   * @param password string
   * @returns Calls the fire auth function to sign in with email and password.
   */
  signInWithEmail(email: string, password: string): Promise<boolean> {
    return this.auth.setPersistence(browserSessionPersistence).then(() => {
      return signInWithEmailAndPassword(this.auth, email, password)
        .then((userCredential) => {
          this.signIn(userCredential);
          return false; // Login succeeded, so return false for no error
        })
        .catch((error) => {
          return true; // Login failed, so return true for error
        });
    });
  }

  /**
   * This function signs in the user if he chooses to take the google account. It creates a new user if it is the first sign in.
   *
   * @returns -
   */
  signInByGoogle(): Promise<void> {
    return signInWithPopup(this.auth, new GoogleAuthProvider())
      .then((result: UserCredential) => {
        const user = result.user;
        if (user) {
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

  /**
   * This function signs in the guest user with set credentials.
   */
  signInGuestUser() {
    const email: string = 'pre92372@ilebi.com';
    const password: string = 'Dy£9+b~WC7i4';

    this.signInWithEmail(email, password);
  }

  /**
   * This function signs in the user if the user is verified.
   *
   * @param userCredential object from firebase authentication
   */
  async signIn(userCredential: UserCredential) {
    this.userCredential = userCredential;
    const userSignedIn = userCredential.user;
    const userId = userCredential.user.uid;

    if (userSignedIn.emailVerified) {
      this.setIsSignedInTrue(userId);
      this.usersService.getCurrentUser(userId);
      this.usersService.updateCurrentUserEmail(
        userCredential.user.email,
        userId
      );
      this.router.navigate(['landingPage']);
    } else {
      this.snackbarService.openSnackBarVerifyEmail(
        'Bitte verifiziere deine E-Mail-Adresse, bevor du dich anmeldest.',
        'Verfizierungslink erneut senden.',
        this.resendVerificationEmail.bind(this)
      );
      this.auth.signOut();
    }
  }

  /**
   * This function resends the verification email if the user asks for it via the snackbar.
   */
  resendVerificationEmail() {
    sendEmailVerification(this.userCredential!.user);
    this.snackbarService.openSnackBar(
      `Wir haben die Email zur Verfizierung an ${this.userCredential?.user.email} geschickt.`,
      'Schliessen'
    );
  }

  /**
   * This function sets the boolean isSignedIn on the user to true.
   *
   * @param userId string
   */
  async setIsSignedInTrue(userId: string) {
    const docRef = doc(this.firestore, 'users', userId);
    await updateDoc(docRef, {
      isSignedIn: true,
    });
  }

  /**
   * This function signs out the user. If successful it navigates the user to the login page.
   *
   * @returns Calls the signOut function of fire auth.
   */
  async signOut(currentUserId: string) {
    try {
      await this.setIsSignedInFalse(currentUserId);
    } catch (error) {
      console.log('Set is signed in failed', error);
      return;
    }
    try {
      this.usersService.unsubscribeFromData();
      sessionStorage.removeItem('currentUser');
      this.usersService.setCurrentUserNull();
      await signOut(this.auth);
      this.router.navigate(['/login']);
    } catch (error) {
      this.snackbarService.openSnackBar(
        'Logout ist fehlgeschlagen. Bitte versuche es erneut.',
        'Close'
      );
    }
  }

  /**
   * This function sets the flag isSignedIn to false if the user logs out.
   *
   * @param userId string
   */
  async setIsSignedInFalse(userId: string) {
    try {
      const docRef = doc(this.firestore, 'users', userId);
      await updateDoc(docRef, { isSignedIn: false });
    } catch (error) {
      throw new Error('Failed to update sign-in status');
    }
  }

  /**
   * This function sends an email to a user in case he forgets his password.
   *
   * @param email string
   */
  resetForgottenPassword(email: string) {
    sendPasswordResetEmail(this.auth, email)
      .then(() => {
        this.snackbarService.openSnackBar(
          `Wir haben dir eine Email zum Zurücksetzen des Passwortes an ${email} gesendet. Bitte überprüfe auch deinen Spam-Ordner.`,
          'Schliessen'
        );
        this.router.navigate(['login']);
      })
      .catch((error) => {
        console.log('Send email reset password failed', error);
      });
  }

  /**
   * This function changes the password if the user is signed in.
   *
   * @param password string
   */
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

  /**
   * This function verfies the passwort when the user signs in.
   *
   * @param email string
   * @param password string
   * @returns boolean
   */
  async verifyPassword(email: string, password: string): Promise<boolean> {
    try {
      await signInWithEmailAndPassword(this.auth, email, password);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * This function changes changes the email of the user. The user is then signed out because he needs to verfiy the new email address again.
   *
   * @param newEmail string
   * @param password string
   */
  async changeEmail(newEmail: string, password: string): Promise<void> {
    const currentUser = this.auth.currentUser;
    if (currentUser) {
      try {
        const credential = EmailAuthProvider.credential(
          currentUser.email!,
          password
        );
        await reauthenticateWithCredential(currentUser, credential);
        await verifyBeforeUpdateEmail(currentUser, newEmail);
      } catch (error) {
        console.error('Email update failed:', error);
      }
    } else {
      console.error('No user is currently logged in.');
    }
  }

  /**
   * This function checks the authentication status of the user.
   *
   * @returns observable
   */
  isAuthenticated(): Observable<boolean> {
    return new Observable((subscriber) => {
      onAuthStateChanged(this.auth, (user) => {
        subscriber.next(!!user);
        subscriber.complete();
      });
    });
  }

  /**
   * This function redircets the user to the landingpage if she is authenticated. Like this she cannot get to login or register page.
   */
  redirectAuthorizedTo(): void {
    this.authSubscription = this.isAuthenticated()
      .pipe(
        map((isAuthenticated) => {
          if (isAuthenticated) {
            this.router.navigate(['landingPage']);
          }
        })
      )
      .subscribe();
  }

  /**
   * This function cleans up after the service is destroyed.
   */
  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }
}
