import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';
import { DirectMessage } from '../../models/direct-message.class';
import { MinimalUser } from '../../models/minimal_user.class';
import { User } from '../../models/user.class';
import { Post } from '../../models/post.class';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root',
})
export class DirectMessagesService {
  firestore = inject(Firestore);

  private directMessageSubject: BehaviorSubject<DirectMessage | null> =
    new BehaviorSubject<DirectMessage | null>(null);
  public directMessage$ = this.directMessageSubject.asObservable();

  constructor() {}

  /**
   * This function gets the data of a direct message. If the user clicks on a user it first checks if a conversation already exists. If not it creates a document and then fetches the data.
   *
   * @param userId string
   * @param currentUser objecet User
   */
  async getDataDirectMessage(userId: string, currentUser: User) {
    const idDirectMessage = await this.getIdDirectMessage(userId, currentUser);

    if (idDirectMessage) {
      const unsub = onSnapshot(
        doc(this.firestore, 'directMessages', idDirectMessage),
        (doc) => {
          const directMessageData = doc.data() as DirectMessage;
          console.log(directMessageData);

          this.directMessageSubject.next(directMessageData);
        }
      );
    } else {
      this.createDirectMessage(userId, currentUser);
      debugger;
    }
  }
  /**
   * This function gets the ID of the document of the direct message or null if the document does not exist yet.
   *
   * @param userId string of user you want to chat with
   * @returns string of document ID or null
   */

  async getIdDirectMessage(
    userId: string,
    currentUser: User
  ): Promise<string | null> {
    const currentUserId = currentUser.id;

    try {
      const collectionRef = collection(this.firestore, 'directMessages');

      const querySnapshot = await getDocs(collectionRef);
      for (const doc of querySnapshot.docs) {
        const users = doc.data()['users'];
        const hasCurrentUserId = users.some(
          (user: { id: string }) => user.id === currentUserId
        );
        const hasUserId = users.some(
          (user: { id: string }) => user.id === userId
        );

        if (hasCurrentUserId && hasUserId) {
          debugger;
          return doc.id;
        }
      }

      return null;
    } catch (error) {
      console.error('Error checking direct messages: ', error);
      return null;
    }
  }

  /**
   * This function creates a new document in case there was no conversation started between the two users.
   *
   * @param userId string
   * @param currentUser objecet User
   */
  async createDirectMessage(userId: string, currentUser: User): Promise<void> {
    const directMessageRef = collection(this.firestore, 'directMessages');
    const newDocRef = doc(directMessageRef);

    const users = await this.createMinimalUsers(userId, currentUser);
    debugger;
    const directMessageData: DirectMessage = {
      id: newDocRef.id,
      users: users,
      posts: [],
    };

    await setDoc(newDocRef, directMessageData);
    console.log('Direct message successfully created!');

    const idDirectMessage = directMessageData.id;

    if (idDirectMessage) {
      const unsub = onSnapshot(
        doc(this.firestore, 'directMessages', idDirectMessage),
        (doc) => {
          const directMessageData = doc.data() as DirectMessage;
          this.directMessageSubject.next(directMessageData);
          console.log(directMessageData);
        }
      );
    }
  }

  /**
   * This function creates a minimal user. This is needed to store on the document of the channel. Minimal user contains the properties of the interface minimalUser
   *
   * @param userId string
   * @param currentUser objecet User
   * @returns object minimalUser
   */
  async createMinimalUsers(
    userId: string,
    currentUser: User
  ): Promise<MinimalUser[]> {
    try {
      const userDocRef = doc(this.firestore, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      debugger;
      if (userDoc.exists()) {
        const userData = userDoc.data();

        const users: MinimalUser[] = [
          {
            id: userDoc.id,
            avatar: userData['avatar'],
            name: userData['name'],
            email: userData['email'],
          },
          {
            id: currentUser.id,
            avatar: currentUser.avatar,
            name: currentUser.name,
            email: currentUser.email,
          },
        ];

        return users;
      } else {
        console.error('User document does not exist');
        return [];
      }
    } catch (error) {
      console.error('Error fetching user document: ', error);
      return [];
    }
  }

  /**
   * This function saves a post in the document of the corresponding direct message.
   *
   * @param directMessageId string
   * @param message string
   * @param currentUser object User
   */
  async savePost(directMessageId: string, message: string, currentUser: User) {
    const directMessageRef = doc(
      this.firestore,
      'directMessages',
      directMessageId
    );

    const post: Post = {
      id: this.createId(),
      name: currentUser.name,
      avatar: currentUser.avatar,
      message: message,
      timestamp: this.getUTXTimestamp(),
      reactions: [],
      edited: false,
      files: [],
      userId: currentUser.id,
    };

    await updateDoc(directMessageRef, { posts: arrayUnion(post) });
  }

  /**
   * This function creates a unique ID. It is needed to store the post in the document.
   * @returns ID as string
   */
  createId(): string {
    return uuidv4();
  }

  /**
   * This function gets the actual UTX timestamp.
   *
   * @returns UTX timestamp as number
   */
  getUTXTimestamp(): number {
    return Date.now();
  }

  /**
   * This function is needed if a user edits a post. The timestamp is updated and the variable "edited" is set to true so edited can be displayed.
   *
   * @param directMessageId string
   * @param postIndex number
   * @param newMessage string
   * @returns objecet as post
   */
  async editPost(
    directMessageId: string,
    postIndex: number,
    newMessage: string
  ): Promise<void> {
    try {
      const directMessageRef = doc(
        this.firestore,
        'directMessages',
        directMessageId
      );

      const directMessageDoc = await getDoc(directMessageRef);
      if (!directMessageDoc.exists()) {
        console.error('Direct Message does not exist');
        return;
      }

      const directMessageData = directMessageDoc.data();
      const posts: Post[] = directMessageData['posts'];

      if (postIndex >= posts.length || postIndex < 0) {
        console.error('Invalid post index');
        return;
      }

      posts[postIndex] = {
        ...posts[postIndex],
        message: newMessage,
        timestamp: this.getUTXTimestamp(),
        edited: true,
      };

      await updateDoc(directMessageRef, { posts });

      console.log('Post successfully updated!');
    } catch (error) {
      console.error('Error updating post: ', error);
    }
  }
}
