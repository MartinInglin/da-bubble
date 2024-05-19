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
  getDoc,
} from '@angular/fire/firestore';
import { User } from '../models/user.class';
import { RegistrationService } from './registration.service';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
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

      sessionStorage.setItem('currentUser', JSON.stringify(userData));
    });
  }

  async createChannel(name: string, users: Partial<User>[]): Promise<void> {
    const channelRef = collection(this.firestore, 'channels');
    const newDocRef = doc(channelRef);

    const channelData: Channel = {
      id: newDocRef.id,
      name: name,
      users: users,
      posts: [],
    };

    await setDoc(newDocRef, channelData);
    const userIds = users
      .map((user) => user.id)
      .filter((id): id is string => !!id);
    this.addUsersToChannel(channelData.id, channelData.name, userIds);
  }

  async addUsersToChannel(channelId: string, name: string, userIds: string[]) {
    const channel = {
      id: channelId,
      name: name,
    };

    for (const userId of userIds) {
      const userDocRef = doc(this.firestore, 'users', userId);
      await updateDoc(userDocRef, {
        channels: arrayUnion(channel),
      });
    }
  }

  async removeUserFromChannel(channelId: string, currentUserId:string): Promise<void> {
    debugger;
    if (currentUserId) {

      const userDocRef = doc(this.firestore, 'users', currentUserId);
  
      const userDoc = await getDoc(userDocRef);
  
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const channels = userData['channels'] || [];
  
        const indexOfChannel = this.getIndexOfChannel(channels, channelId);
  
        if (indexOfChannel !== -1) {
          channels.splice(indexOfChannel, 1);
  
          await updateDoc(userDocRef, { channels: channels });
        }
      }
    }

    const channelDocRef = doc(this.firestore, 'channels', channelId)

    const channelDoc = await getDoc(channelDocRef)

    if (channelDoc.exists()) {
      const channelData = channelDoc.data();
      const users = channelData['users'] || [];

      const indexOfUser = this.getIndexOfUser(users, currentUserId)

      if (indexOfUser !== -1) {
        users.splice(indexOfUser, 1);

        await updateDoc(channelDocRef, {users: users})
      }
    }
  }
  
  getIndexOfChannel(channels: any[], channelId: string): number {
    return channels.findIndex((channel: any) => channel.id === channelId);
  }

  getIndexOfUser(users: any[], userId: string): number {
    return users.findIndex((user:any) => user.id === userId);
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
