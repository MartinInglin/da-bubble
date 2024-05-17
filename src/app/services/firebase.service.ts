import { Injectable, inject } from '@angular/core';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { User } from '../models/user.class';

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  user:User = new User;
  firestore = inject(Firestore)

  constructor() {}

  async createUser(id: string, name: string, email: string): Promise<void> {
    const user = {
      id: id,
      name: name,
      email: email
    };

    await setDoc(doc(this.firestore, 'users', id), user);
  }
}
