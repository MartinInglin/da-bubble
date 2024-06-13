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
  getDoc,
} from '@angular/fire/firestore';
import { User } from '../../models/user.class';
import { RegistrationService } from '../registration.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { UserCredential } from '@angular/fire/auth';
import { StorageService } from '../storage.service';
import { MinimalChannel } from '../../models/minimal_channel.class';
import { Post } from '../../models/post.class';
import { Reaction } from '../../models/reaction.class';

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
      avatar = await this.storageService.saveImageUser(userData.avatarFile);
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
      isChannel: false,
      savedEmojis: [],
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
        isChannel: false,
        savedEmojis: [],
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
        this.currentUserSubject.next(userData);
        sessionStorage.setItem('currentUser', JSON.stringify(userData));
      }
    );
  }

  getAllUsers(): void {
    const collectionRef = collection(this.firestore, 'users');

    this.unsubscribe = onSnapshot(collectionRef, (snapshot) => {
      const data = snapshot.docs.map(
        (doc) => new User({ id: doc.id, ...doc.data() })
      );
      // Sort the data alphabetically by name
      data.sort((a, b) => a.name.localeCompare(b.name));
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

  async updateUser(
    currentUser: User,
    partialUser: Partial<User>
  ): Promise<void> {
    const userDocRef = doc(this.firestore, 'users', currentUser.id);

    try {
      await updateDoc(userDocRef, partialUser);
    } catch (error) {
      console.error('Error updating user in Firestore:', error);
    }

    if (partialUser) {
      this.createPathToCollection(partialUser, currentUser);
    }
  }

  createPathToCollection(partialUser: Partial<User>, currentUser: User) {
    let path: 'channels' | 'directMessages' | 'threads';

    path = 'directMessages';
    this.getDataCollection(path, currentUser, partialUser);

    path = 'channels';
    this.getDataCollection(path, currentUser, partialUser);

    path = 'threads';
    this.getDataCollection(path, currentUser, partialUser);
  }

  async getDataCollection(
    path: string,
    currentUser: User,
    partialUser: Partial<User>
  ) {
    const collectionRef = collection(this.firestore, path);
    const querySnapshot = await getDocs(collectionRef);

    querySnapshot.forEach(async (document) => {
      const data = document.data();
      const posts = data['posts'];

      if (Array.isArray(posts)) {
        await this.updatePostInFirestore(
          path,
          document.id,
          posts,
          currentUser,
          partialUser
        );
      }
      if (partialUser.name !== currentUser.name) {
        await this.updateReactionIFirestore(
          path,
          document.id,
          posts,
          currentUser,
          partialUser
        );
      }
    });
  }

  async updatePostInFirestore(
    path: string,
    documentId: string,
    posts: Partial<Post>[],
    currentUser: User,
    partialUser: Partial<User>
  ) {
    let updatedPosts = false;

    posts.forEach((post) => {
      if (post.userId === currentUser.id) {
        post.name = partialUser.name;
        post.avatar = partialUser.avatar;
        updatedPosts = true;
      }
    });

    if (updatedPosts) {
      const documentRef = doc(this.firestore, path, documentId);
      await updateDoc(documentRef, { posts: posts });
    }
  }

  async updateReactionIFirestore(
    path: string,
    documentId: string,
    posts: Partial<Post>[],
    currentUser: User,
    partialUser: Partial<User>
  ) {
    let updatedPosts = false;

    posts.forEach((post) => {
      if (post.reactions) {
        post.reactions.forEach((reaction) => {
          if (reaction.userId === currentUser.id) {
            if (partialUser.name) {
              reaction.userName = partialUser.name;
              updatedPosts = true;
            }
          }
        });
      }
    });
    if (updatedPosts) {
      const documentRef = doc(this.firestore, path, documentId);
      await updateDoc(documentRef, { posts: posts });
    }
  }

  setCurrentUserNull() {
    this.currentUserSubject.next(null);
  }

  public unsubscribeFromData() {
    this.unsubscribe();
  }

  async saveUsedEmoji(currentUserId: string, emoji: string) {
    const docRef = doc(this.firestore, 'users', currentUserId);
    const document = await getDoc(docRef);
    const docData = document.data();

    if (docData) {
      const savedEmojis = docData['savedEmojis'];
      if (savedEmojis[1] === emoji) {
        return;
      } else if (savedEmojis.length == 2) {
        savedEmojis.splice(0, 1);
      }
      savedEmojis.push(emoji);

      await updateDoc(docRef, { savedEmojis: savedEmojis });
    }
  }
}

// posts.forEach((post: Post) => {
//   let reactions = post.reactions;
//   reactions.forEach(reaction => {
//     if (reaction.userId === currentUserId) {
//       reaction.userName = partialUser.name
//     }
//   });
// })
