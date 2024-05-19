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

  private userSubscription: Subscription = new Subscription();
  currentUser: User | null = new User();

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

  ngOnInit(): void {
    this.userSubscription = this.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });
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

  async removeUserFromChannel(channelId: string): Promise<void> {
    if (this.currentUser) {
      const userId = this.currentUser.id;
      const userDocRef = doc(this.firestore, 'users', userId);
  
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
  }
  
  getIndexOfChannel(channels: any[], channelId: string): number {
    return channels.findIndex((channel: any) => channel.id === channelId);
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

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }
}
