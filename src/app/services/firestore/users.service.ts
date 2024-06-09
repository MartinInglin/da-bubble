import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  doc,
  onSnapshot,
  setDoc,
  getDocs,
  collection,
  updateDoc,
  query,
  arrayUnion,
  where,
  QuerySnapshot,
  CollectionReference,
  DocumentData,
} from '@angular/fire/firestore';
import { User } from '../../models/user.class';
import { RegistrationService } from '../registration.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { UserCredential } from '@angular/fire/auth';
import { StorageService } from '../storage.service';
import { MinimalChannel } from '../../models/minimal_channel.class';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  storageService = inject(StorageService);
  firestore = inject(Firestore);
  registrationService = inject(RegistrationService);

  user: User = new User();

  private unsubscribe: any;

  private currentUserSubject: BehaviorSubject<User | null> =
    new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> =
    this.currentUserSubject.asObservable();

  private allUsersSubject: BehaviorSubject<User[] | null> = new BehaviorSubject<
    User[] | null
  >(null);
  public allUsersSubject$: Observable<User[] | null> =
    this.allUsersSubject.asObservable();

  constructor() {
    const storedUser = sessionStorage.getItem('currentUser');
    if (storedUser) {
      try {
        this.currentUserSubject.next(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user data:', error);
      }
    }

    this.getAllUsers();

    const currentUserId = this.currentUserSubject.value?.id;
    if (currentUserId) {
      this.getCurrentUser(currentUserId);
    }
  }

  /**
   * This function creates a new user document in the collection users.
   *
   * @param userId string
   */
  async createUser(userId: string): Promise<void> {
    const userData = this.registrationService.getUserData();

    let avatar = userData.avatar;

    if (userData.avatarFile && userData.avatarFile.name !== 'empty.txt') {
      avatar = await this.storageService.saveImageUser(
        userId,
        userData.avatarFile
      );
    }

    const user: User = {
      id: userId,
      name: userData.name,
      email: userData.email,
      avatar: avatar,
      privateDirectMessageId: '',
      channels: [],
      isGoogleAccount: false,
      isSignedIn: false,
    };

    await setDoc(doc(this.firestore, 'users', userId), user);
  }

  /**
   * This function creates a user in firestore if the user signs in with a google account.
   *
   * @param userCredential object from firebase authentication
   */
  async createUserGoogle(userCredential: UserCredential) {
    const googleUser = userCredential.user;

    const userId = googleUser.uid;
    const userName = googleUser.displayName;
    const userEmail = googleUser.email;
    const userAvatar = 'assets/images/avatars/profile.svg';

    if (userName && userEmail) {
      const user: User = {
        id: userId,
        name: userName,
        email: userEmail,
        avatar: userAvatar,
        privateDirectMessageId: '',
        channels: [],
        isGoogleAccount: true,
        isSignedIn: false,
      };
      await setDoc(doc(this.firestore, 'users', userId), user);
    }
  }

  /**
   * This function gets the object of the current user and stores it as an obeservable. Every component that needs this data can subscribe to it.
   *
   * @param userId string
   */
  getCurrentUser(userId: string): void {
    this.unsubscribe = onSnapshot(
      doc(this.firestore, 'users', userId),
      (doc) => {
        const userData = doc.data() as User;
        console.log('Firestore document updated:', userData);
        this.currentUserSubject.next(userData);
        sessionStorage.setItem('currentUser', JSON.stringify(userData));
      }
    );
  }

  /**
   * This function gets the data of all users and stores it as an observable. Every component that needs this data can subscribe to it.
   */
  getAllUsers(): void {
    const collectionRef = collection(this.firestore, 'users');

    this.unsubscribe = onSnapshot(collectionRef, (snapshot) => {
      const data = snapshot.docs.map(
        (doc) => new User({ id: doc.id, ...doc.data() })
      );
      this.allUsersSubject.next(data);
    });
  }

  async addChannelToSingleUser(
    userId: string,
    channel: MinimalChannel
  ): Promise<void> {
    try {
      const userDocRef = doc(this.firestore, 'users', userId);
      await updateDoc(userDocRef, {
        channels: arrayUnion(channel),
      });
    } catch (error) {
      console.error('Error adding channel to user:', error);
    }
  }

  async addChannelToUsers(channel: MinimalChannel): Promise<void> {
    const collectionRef = collection(this.firestore, 'users');
    const userQuery = query(collectionRef);
    const querySnapshot = await getDocs(userQuery);

    const updatePromises = querySnapshot.docs.map((docSnapshot) => {
      const user = docSnapshot.data() as User;
      if (!user.channels.some((c: MinimalChannel) => c.id === channel.id)) {
        user.channels.push(channel);
        return updateDoc(doc(this.firestore, 'users', user.id), {
          channels: user.channels,
        });
      }
      return Promise.resolve();
    });
    await Promise.all(updatePromises);
  }

  async updateUser(userId: string, partialUser: Partial<User>): Promise<void> {
    const userDocRef = doc(this.firestore, 'users', userId);

    try {
      await updateDoc(userDocRef, partialUser);
    } catch (error) {
      console.error('Error updating user in Firestore:', error);
    }
    if (partialUser.name) {
      this.changeUserNameInPosts(partialUser.name, userId);
    }
  }

  changeUserNameInPosts(newUserName: string, currentUserId: string) {
      let path: 'channels' | 'directMessages' | 'threads';
  
      path = 'directMessages'
      this.changeUserNameInCollection(path, currentUserId, newUserName);

      path = 'channels'
      this.changeUserNameInCollection(path, currentUserId, newUserName);

      this.updateThreadsInChannels(currentUserId, newUserName);
  }
  

  async changeUserNameInCollection(path: string, currentUserId:string, newUserName: string) {
    const collectionRef = collection(this.firestore, path);
    const querySnapshot = await getDocs(collectionRef);

    querySnapshot.forEach(async (document) => {
      const data = document.data();
      const posts = data['posts'];

      if (Array.isArray(posts)) {
        let updatedPosts = false;

        posts.forEach((post) => {
          if (post.userId === currentUserId) {
            post.name = newUserName;
            updatedPosts = true;
          }
        });

        if (updatedPosts) {
          const documentRef = doc(
            this.firestore,
            path,
            document.id
          );
          await updateDoc(documentRef, { posts: posts });
          console.log(`Updated document ${document.id} with new user name.`);
        }
      }
    });
  }

  async updateThreadsInChannels(currentUserId: string, newUserName: string) {
    const channelsRef = collection(this.firestore, 'channels');
    const querySnapshot = await getDocs(channelsRef);

    querySnapshot.forEach(async (channelDoc) => {
        const threadsRef = collection(this.firestore, `channels/${channelDoc.id}/threads`);

        const threadsSnapshot = await getDocs(threadsRef);

        threadsSnapshot.forEach(async (threadDoc) => {
            const data = threadDoc.data();
            const posts = data['posts'];

            if (Array.isArray(posts)) {
                let updatedPosts = false;

                posts.forEach((post) => {
                    if (post.userId === currentUserId) {
                        post.name = newUserName;
                        updatedPosts = true;
                    }
                });

                if (updatedPosts) {
                    const threadRef = doc(this.firestore, `channels/${channelDoc.id}/threads`, threadDoc.id);
                    await updateDoc(threadRef, { posts: posts });
                    console.log(`Updated thread ${threadDoc.id} in channel ${channelDoc.id} with new user name.`);
                }
            }
        });
    });
}


  setCurrentUserNull() {
    this.currentUserSubject.next(null);
  }

  public unsubscribeFromData() {
    this.unsubscribe();
  }
}
