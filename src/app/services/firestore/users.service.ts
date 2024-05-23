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

  /**
   * This function creates a new user document in the collection users.
   * 
   * @param UserId string
   */
  async createUser(UserId: string): Promise<void> {
    const userData = this.registrationService.getUserData();

    const user = {
      id: UserId,
      name: userData.name,
      email: userData.email,
      avatar: userData.avatar,
      channels: [],
    };

    await setDoc(doc(this.firestore, 'users', UserId), user);
  }

  /**
   * This function gets the object of the current user and stores it as an obeservable. Every component that needs this data can subscribe to it.
   * 
   * @param userId string
   */
  getCurrentUser(userId: string) {
    const unsub = onSnapshot(doc(this.firestore, 'users', userId), (doc) => {
      const userData = doc.data() as User;
      this.currentUserSubject.next(userData);

      sessionStorage.setItem('currentUser', JSON.stringify(userData));
    });
  }

  /**
   * This function gets the data of all users and stores it as an observable. Every component that needs this data can subscribe to it.
   */
  getAllUsers(): void {
    const collectionRef = collection(this.firestore, 'users');

    onSnapshot(collectionRef, (snapshot) => {
      const data = snapshot.docs.map((doc) => new User({ id: doc.id, ...doc.data() }));
      this.allUsersSubject.next(data);
    });
  }

  async updateUser(userId: string, updatedData: Partial<User>): Promise<void> {
    const userRef = doc(this.firestore, 'users', userId);
    await setDoc(userRef, updatedData, { merge: true });
  }
}
