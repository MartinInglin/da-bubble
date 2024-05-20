import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  doc,
  onSnapshot,
  setDoc,
  collection,
} from '@angular/fire/firestore';
import { User } from '../../models/user.class';
import { RegistrationService } from '../registration.service';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
@Injectable({
  providedIn: 'root',
})
export class UsersService {
  user: User = new User();

  private currentUserSubject: BehaviorSubject<User | null> =
    new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> =
    this.currentUserSubject.asObservable();

  private allUsersSubject: BehaviorSubject<User[] | null> =
    new BehaviorSubject<User[] | null>(null);
  public allUsersSubject$: Observable<User[] | null> =
    this.allUsersSubject.asObservable();

  firestore = inject(Firestore);
  registrationService = inject(RegistrationService);

  constructor() {
    const storedUser = sessionStorage.getItem('currentUser');
    if (storedUser) {
      try {
        this.currentUserSubject.next(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user data:', error);
      }
    }
  }

  async createUser(id: string): Promise<void> {
    const userData = this.registrationService.getUserData();

    const user = {
      id: id,
      name: userData.name,
      email: userData.email,
      avatar: userData.avatar,
      channels: [],
    };

    await setDoc(doc(this.firestore, 'users', id), user);
  }

  getCurrentUser(userId: string) {
    const unsub = onSnapshot(doc(this.firestore, 'users', userId), (doc) => {
      const userData = doc.data() as User;
      this.currentUserSubject.next(userData);

      sessionStorage.setItem('currentUser', JSON.stringify(userData));
    });
  }

  getAllUsers(): void {
    const collectionRef = collection(this.firestore, 'users');

    onSnapshot(collectionRef, (snapshot) => {
      const data = snapshot.docs.map((doc) => new User({ id: doc.id, ...doc.data() }));
      this.allUsersSubject.next(data);
    });
  }

  // async getAllUsers(): Promise<User[]> {
  //   const users: User[] = [];
  //   const querySnapshot = await getDocs(collection(this.firestore, 'users'));
  //   querySnapshot.forEach((doc) => {
  //     const userData = doc.data() as User;
  //     users.push(userData);
  //   });
  //   return users;
  // }
}
