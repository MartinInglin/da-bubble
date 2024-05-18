import { Injectable, inject } from '@angular/core';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { User } from '../models/user.class';
import { RegistrationService } from './registration.service';

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  user:User = new User;
  firestore = inject(Firestore);
  registrationService = inject(RegistrationService);

  constructor() {}

  async createUser(id: string): Promise<void> {
    const userData = this.registrationService.getUserData();

    const user = {
      id: id,
      name: userData.name,
      email: userData.email,
      avatar: userData.avatar
    };

    await setDoc(doc(this.firestore, 'users', id), user);
  }
}
