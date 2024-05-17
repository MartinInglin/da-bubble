import { Injectable, inject } from '@angular/core';
import { FirebaseApp } from '@angular/fire/app';
import {
  Auth,
  createUserWithEmailAndPassword,
  getAuth,
} from '@angular/fire/auth';
import { Router } from '@angular/router';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth: Auth;
  private router = inject(Router);
  firebaseService = inject(FirebaseService);

  constructor(private afApp: FirebaseApp) {
    this.auth = getAuth(afApp);
  }

  signUp(name:string, email: string, password:string): Promise<void> {
    return createUserWithEmailAndPassword(this.auth, email, password)
      .then((userCredential) => {
        const id = userCredential.user.uid
        this.firebaseService.createUser(id, name, email)
      })
      .then(() => {
        this.router.navigate(['/chooseAvatar']);
      })
      .catch((error) => {
        console.error('Error during sign up:', error);
      });
  }
}
