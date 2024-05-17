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

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth: Auth;
  private router = inject(Router);
  firebaseService = inject(FirebaseService);
  registrationService = inject(RegistrationService)

  constructor(private afApp: FirebaseApp) {
    this.auth = getAuth(afApp);
  }

  signUp(): Promise<void> {
    debugger;
    const userData = this.registrationService.getUserData();
    
    return createUserWithEmailAndPassword(this.auth, userData.email, userData.password)
      .then((userCredential) => {
        const id = userCredential.user.uid;
        this.firebaseService.createUser(id, userData.name, userData.email);
      })
      .then(() => {
        this.router.navigate(['/login']);
      })
      .catch((error) => {
        console.error('Error during sign up:', error);
      });
  }
}
