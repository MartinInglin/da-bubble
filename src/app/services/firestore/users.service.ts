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
  getDoc,
} from '@angular/fire/firestore';
import { User } from '../../models/user.class';
import { RegistrationService } from '../registration.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { UserCredential } from '@angular/fire/auth';
import { StorageService } from '../storage.service';
import { MinimalChannel } from '../../models/minimal_channel.class';
import { Post } from '../../models/post.class';
import { MinimalUser } from '../../models/minimal_user.class';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  storageService = inject(StorageService);
  firestore = inject(Firestore);
  registrationService = inject(RegistrationService);

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
    const avatar = await this.getUserAvatar(userData);
    const user = this.buildUser(userId, userData, avatar);
    await setDoc(doc(this.firestore, 'users', userId), user);
  }

  /**
   * This function saves an individual profile image of the user in the firebase storage and returns the corresponding URL.
   *
   * @param userData data that the user input in the registration process
   * @returns URL of image
   */
  async getUserAvatar(userData: any): Promise<string> {
    if (userData.avatarFile && userData.avatarFile.name !== 'empty.txt') {
      return await this.storageService.saveImageUser(userData.avatarFile);
    }
    return userData.avatar;
  }

  /**
   * This function returns all data of the user in an object.
   *
   * @param userId string
   * @param userData object
   * @param avatar string, might be URL or path to image
   * @returns object of type user
   */
  buildUser(userId: string, userData: any, avatar: string): User {
    return {
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

  /**
   * This function creates a snapshot of all users
   */
  getAllUsers(): void {
    const collectionRef = collection(this.firestore, 'users');

    this.unsubscribe = onSnapshot(collectionRef, (snapshot) => {
      const data = snapshot.docs.map(
        (doc) => new User({ id: doc.id, ...doc.data() })
      );
      data.sort((a, b) => a.name.localeCompare(b.name));
      this.allUsersSubject.next(data);
    });
  }

  /**
   * This function adds a channel to a user. This is need to display all the channel if a user is signed in.
   *
   * @param userId string
   * @param channel object as minimal channel
   */
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

  /**
   * This function adds a channel to all users. It is needed if a user creates a new channel and selects to add all users to it.
   *
   * @param channel object of type minimal channel
   */
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

  /**
   * This function updates the user if she changes credentials such as name, email or avatar.
   *
   * @param currentUser object of type user
   * @param partialUser part of the the user class
   */
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

  /**
   * This function creates the paths to the collection and then calls for getting the corresponding data.
   *
   * @param partialUser part of the the user class
   * @param currentUser object of type user
   */
  createPathToCollection(partialUser: Partial<User>, currentUser: User) {
    let path: 'channels' | 'directMessages' | 'threads';

    path = 'directMessages';
    this.getDataCollection(path, currentUser, partialUser);

    path = 'channels';
    this.getDataCollection(path, currentUser, partialUser);

    path = 'threads';
    this.getDataCollection(path, currentUser, partialUser);
  }

  /**
   * This function gets the data of each given path. It then starts updating the data on firestore.
   *
   * @param path string of type path
   * @param currentUser object of type user
   * @param partialUser object that contains part of the user
   */
  async getDataCollection(
    path: string,
    currentUser: User,
    partialUser: Partial<User>
  ) {
    const collectionRef = collection(this.firestore, path);
    const querySnapshot = await getDocs(collectionRef);

    querySnapshot.forEach(async (document) => {
      const data = document.data();

      if (path === 'channels' || path === 'directMessages') {
        const users = data['users'];
        this.updateNameAvatar(
          users,
          currentUser,
          partialUser,
          document.id,
          path
        );
      }

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

  /**
   * This function updates the name and the avatar of the user. It then stores them on firebase.
   * 
   * @param users array of minimal users
   * @param currentUser object of type user
   * @param partialUser part of the user object
   * @param documentId string
   * @param path string of type path
   */
  async updateNameAvatar(
    users: MinimalUser[],
    currentUser: User,
    partialUser: Partial<User>,
    documentId: string,
    path: 'channels' | 'directMessages'
  ) {
    let updatedUsers = false;
    users.forEach((user) => {
      if (user.id === currentUser.id) {
        user.name = partialUser.name || currentUser.name;
        user.avatar = partialUser.avatar || currentUser.avatar;
        updatedUsers = true;
      }
    });

    if (updatedUsers) {
      const documentRef = doc(this.firestore, path, documentId);
      await updateDoc(documentRef, { users: users });
    }
  }

  /**
   * This function updates all posts of a collection in firestore if the user-ID in the post and the ID of the current user are identical.
   * 
   * @param path string of type path
   * @param documentId string
   * @param posts array of partial posts
   * @param currentUser object of type user
   * @param partialUser part of the object user
   */
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

  /**
   * This function updates all reactions of a collection in firestore if the user-ID in the post and the ID of the current user are identical.
   * 
   * @param path string of type path
   * @param documentId string
   * @param posts array of partial posts
   * @param currentUser object of type user
   * @param partialUser part of the object user
   */
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

    /**
   * This function saves the last two used emojis on the user.
   * 
   * @param currentUserId string
   * @param emoji string
   * @returns if emojis are the same
   */
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

  /**
   * This function sets the current user to null. It is needed to avoid data leaks after the user signed out.
   */
  setCurrentUserNull() {
    this.currentUserSubject.next(null);
  }

  /**
   * This function unsubscribes from the user data subscription.
   */
  public unsubscribeFromData() {
    this.unsubscribe();
  }
}
