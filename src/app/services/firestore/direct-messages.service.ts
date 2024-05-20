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
import { BehaviorSubject, Observable } from 'rxjs';
import { DirectMessage } from '../../models/direct_message.class';
import { MinimalUser } from '../../interfaces/minimal-user';
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
  public directMessageSubject$: Observable<DirectMessage | null> =
    this.directMessageSubject.asObservable();

  constructor() {}

  async getDataDirectMessage(userId: string, currentUser: User) {
    const idDirectMessage = await this.getIdDirectMessage(userId);

    if (idDirectMessage) {
      const unsub = onSnapshot(
        doc(this.firestore, 'directMessages', idDirectMessage),
        (doc) => {
          const directMessageData = doc.data() as DirectMessage;
          this.directMessageSubject.next(directMessageData);
          console.log(directMessageData);
        }
      );
    } else {
      this.createDirectMessage(userId, currentUser);
    }
  }

  async getIdDirectMessage(userId: string): Promise<string | null> {
    try {
      const collectionRef = collection(this.firestore, 'directMessages');
      const querySnapshot = await getDocs(collectionRef);

      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data();
        const users = data['users'] || [];

        for (let i = 0; i < users.length; i++) {
          if (users[i].id === userId) {
            return docSnapshot.id;
          }
        }
      }
      return null;
    } catch (error) {
      console.error('Error checking direct messages: ', error);
      return null;
    }
  }

  async createDirectMessage(userId: string, currentUser: User): Promise<void> {
    const directMessageRef = collection(this.firestore, 'directMessages');
    const newDocRef = doc(directMessageRef);

    const users = await this.createMinimalUsers(userId, currentUser);

    const directMessageData: DirectMessage = {
      id: newDocRef.id,
      users: users,
      posts: [],
    };

    await setDoc(newDocRef, directMessageData);
    console.log('Direct message successfully created!');

    const idDirectMessage = await this.getIdDirectMessage(userId);

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

  async createMinimalUsers(
    userId: string,
    currentUser: User
  ): Promise<MinimalUser[]> {
    try {
      const userDocRef = doc(this.firestore, 'users', userId);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();

        const users: MinimalUser[] = [
          {
            id: userDoc.id,
            avatar: userData['avatar'],
            name: userData['name'],
          },
          {
            id: currentUser.id,
            avatar: currentUser.avatar,
            name: currentUser.name,
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
    };

    await updateDoc(directMessageRef, { posts: arrayUnion(post) });
  }

  createId(): string {
    return uuidv4();
  }

  getUTXTimestamp(): number {
    return Date.now();
  }

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
