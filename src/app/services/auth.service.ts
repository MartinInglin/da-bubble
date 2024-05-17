import { Injectable } from '@angular/core';
import { Auth, getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth: Auth;

  constructor() {
    this.auth = getAuth();
  }

  signUp(email: string, password: string): Promise<void> {
    return createUserWithEmailAndPassword(this.auth, email, password)
      .then((userCredential) => {
        // Sign up successful
        console.log('Sign up successful:', userCredential.user);
      })
      .catch((error) => {
        // An error occurred
        console.error('Error during sign up:', error);
      });
  }
}
