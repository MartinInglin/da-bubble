import { Injectable, inject } from '@angular/core';
import { Firestore, doc, onSnapshot, setDoc } from '@angular/fire/firestore';
import { User } from '../models/user.class';
import { RegistrationService } from './registration.service';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  user: User = new User();

  private currentUserSubject: BehaviorSubject<User | null> =
    new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> =
    this.currentUserSubject.asObservable();

  firestore = inject(Firestore);
  registrationService = inject(RegistrationService);

  constructor() {}

  async createUser(id: string): Promise<void> {
    const userData = this.registrationService.getUserData();

    const user = {
      id: id,
      name: userData.name,
      email: userData.email,
      avatar: userData.avatar,
    };

    await setDoc(doc(this.firestore, 'users', id), user);
  }

  getCurrentUser(userId: string) {
    const unsub = onSnapshot(doc(this.firestore, 'users', userId), (doc) => {
      const userData = doc.data() as User;
      this.currentUserSubject.next(userData);
    });
  }
}
