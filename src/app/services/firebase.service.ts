import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  doc,
  onSnapshot,
  setDoc,
  getDocs,
  collection,
  updateDoc,
  arrayUnion,
} from '@angular/fire/firestore';
import { User } from '../models/user.class';
import { RegistrationService } from './registration.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { Channel } from '../models/channel.class';

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
    };

    await setDoc(doc(this.firestore, 'users', id), user);
  }

  getCurrentUser(userId: string) {
    const unsub = onSnapshot(doc(this.firestore, 'users', userId), (doc) => {
      const userData = doc.data() as User;
      this.currentUserSubject.next(userData);
      console.log(userData);

      sessionStorage.setItem('currentUser', JSON.stringify(userData));
    });
  }

  async createChannel(name: string, users: string[]): Promise<void> {
    const channelRef = collection(this.firestore, 'channels');
    const newDocRef = doc(channelRef);

    const channelData: Channel = {
      id: newDocRef.id,
      name: name,
      users: users,
      posts: [],
    };

    await setDoc(newDocRef, channelData);

    this.updateUsersToChannel(channelData.id, channelData.name, users);
  }

  async updateUsersToChannel(channelId: String, name: String, userIds: string[]) {
    const channel = {
      id: channelId,
      name: name,
    };

    for (const userId of userIds) {
      const userDocRef = doc(this.firestore,'users', userId);
      await updateDoc(userDocRef, {
        channels: arrayUnion(channel)
      });
    }
  }

  async getAllUsers(): Promise<User[]> {
    const users: User[] = [];
    const querySnapshot = await getDocs(collection(this.firestore, 'users'));
    querySnapshot.forEach((doc) => {
      const userData = doc.data() as User;
      users.push(userData);
    });
    return users;
  }
}
