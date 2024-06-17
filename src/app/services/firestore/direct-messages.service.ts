import { Injectable, inject } from '@angular/core';
import {
  DocumentReference,
  DocumentSnapshot,
  Firestore,
  QuerySnapshot,
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
   *This function gets the data of a direct message
   *
   * @param userId string
   * @param currentUser object of type user
   */
  async getDataDirectMessage(userId: string, currentUser: User) {
    const directMessageId = await this.getIdDirectMessage(userId, currentUser);

    if (directMessageId) {
      const unsub = onSnapshot(
        doc(this.firestore, 'directMessages', directMessageId),
        (doc) => {
          const directMessageData = doc.data() as DirectMessage;
          console.log(directMessageData);

          this.directMessageSubject.next(directMessageData);
        }
      );
    } else {
      this.createDirectMessage(userId, currentUser);
    }
  }

  /**
   * This function gets the data if the user wants to talk to himself.
   *
   * @param currentUser object of type user
   */
  getDataPrivateDirectMessage(currentUser: User) {
    const directMessageId = currentUser.privateDirectMessageId;

    if (directMessageId) {
      const unsub = onSnapshot(
        doc(this.firestore, 'directMessages', directMessageId),
        (doc) => {
          const directMessageData = doc.data() as DirectMessage;
          console.log(directMessageData);

          this.directMessageSubject.next(directMessageData);
        }
      );
    } else {
      this.createPrivateDirectMessage(currentUser);
    }
  }

  /**
   * This function gets the ID of the direct message by comparing the two ID's of the users within the users array of a direct message.
   *
   * @param userId string
   * @param currentUser object of type user
   * @returns document ID as string or null
   */
  async getIdDirectMessage(
    userId: string,
    currentUser: User
  ): Promise<string | null> {
    const currentUserId = currentUser.id;

    try {
      const querySnapshot = await this.getDirectMessagesCollection();
      return this.checkDirectMessage(querySnapshot, userId, currentUserId);
    } catch (error) {
      console.error('Error checking direct messages: ', error);
      return null;
    }
  }

  /**
   * This function gets collection 'directMessages' from firebase.
   *
   * @returns collection of documents from direct messages
   */
  async getDirectMessagesCollection(): Promise<QuerySnapshot> {
    try {
      const collectionRef = collection(this.firestore, 'directMessages');
      return await getDocs(collectionRef);
    } catch (error) {
      console.error('Error getting direct messages collection: ', error);
      throw error;
    }
  }

  /**
   * This function checks if a direct message document already exists.
   *
   * @param querySnapshot snapshot of the collection directMessages
   * @param userId string of the user who is not the current user
   * @param currentUserId string
   * @returns
   */
  checkDirectMessage(
    querySnapshot: QuerySnapshot,
    userId: string,
    currentUserId: string
  ): string | null {
    for (const doc of querySnapshot.docs) {
      const users = doc.data()['users'];
      const hasCurrentUserId = users.some(
        (user: { id: string }) => user.id === currentUserId
      );
      const hasUserId = users.some(
        (user: { id: string }) => user.id === userId
      );

      if (hasCurrentUserId && hasUserId) {
        return doc.id;
      }
    }
    return null;
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
    const directMessageData: DirectMessage = {
      id: newDocRef.id,
      users: users,
      posts: [],
      isPrivateMessage: false,
    };

    this.createNewDocument(newDocRef, directMessageData);
  }

  /**
   * This function creates the new document in firestore.
   *
   * @param newDocRef document reference of the new document
   * @param directMessageData data of type direct message that needs to be stored on firebase
   */
  async createNewDocument(
    newDocRef: DocumentReference,
    directMessageData: DirectMessage
  ) {
    await setDoc(newDocRef, directMessageData);
    this.subscribeToNewDirectMessage(directMessageData);
  }

  /**
   * This function creates a new subscription to the newly created direct message.
   *
   * @param directMessageId string
   */
  subscribeToNewDirectMessage(directMessageData: DirectMessage) {
    const directMessageId = directMessageData.id;
    if (directMessageId) {
      const unsub = onSnapshot(
        doc(this.firestore, 'directMessages', directMessageId),
        (doc) => {
          const directMessageData = doc.data() as DirectMessage;
          this.directMessageSubject.next(directMessageData);
        }
      );
    }
  }

  /**
   * This function creates a new private direct message where the user can talk to himself.
   *
   * @param currentUser object of type user
   */
  async createPrivateDirectMessage(currentUser: User): Promise<void> {
    const directMessageRef = collection(this.firestore, 'directMessages');
    const newDocRef = doc(directMessageRef);

    const users: MinimalUser[] = [
      {
        id: currentUser.id,
        avatar: currentUser.avatar,
        name: currentUser.name,
        email: currentUser.email,
      },
    ];

    const directMessageData: DirectMessage = {
      id: newDocRef.id,
      users: users,
      posts: [],
      isPrivateMessage: true,
    };

    this.createNewPrivateDocument(newDocRef, directMessageData, currentUser);
  }

  /**
   * This function creates a new document for the private conversation.
   *
   * @param newDocRef document reference of the new document
   * @param directMessageData data of type direct message
   * @param currentUser user data of type user
   */
  async createNewPrivateDocument(
    newDocRef: DocumentReference,
    directMessageData: DirectMessage,
    currentUser: User
  ) {
    await setDoc(newDocRef, directMessageData);
    this.subscribeToNewPrivateDirectMessage(directMessageData, currentUser);
  }

  /**
   * This fucntion creates a new subscription to the newly created data.
   *
   * @param directMessageData data of the direct message of type direct message
   * @param currentUser object of type user
   */
  subscribeToNewPrivateDirectMessage(
    directMessageData: DirectMessage,
    currentUser: User
  ) {
    const directMessageId = directMessageData.id;

    if (directMessageId) {
      const unsub = onSnapshot(
        doc(this.firestore, 'directMessages', directMessageId),
        (doc) => {
          const directMessageData = doc.data() as DirectMessage;
          this.directMessageSubject.next(directMessageData);
        }
      );
    }
    this.writeDirectMessageIdOnUser(currentUser, directMessageId);
  }

  /**
   * This function writes the ID of the direct message on the user. This is needed to find the document quickly if the user opens this conversation.
   *
   * @param currentUser object of type user
   * @param directMessageId string
   */
  async writeDirectMessageIdOnUser(currentUser: User, directMessageId: string) {
    const docRef = doc(this.firestore, 'users', currentUser.id);
    await updateDoc(docRef, {
      privateDirectMessageId: directMessageId,
    });
  }

  /**
   * This function creates an array of minimal users for the direct messages. This is needed to store on the document of the channel. Minimal user contains the properties of the interface minimalUser.
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
      if (userDoc.exists()) {
        const users = this.createMinimalUsersArray(userDoc, currentUser);
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
   * This function creates the array of minimal users which contains the current user and the user selected.
   *
   * @param userDoc document of the user selected
   * @param currentUser object of type user
   * @returns
   */
  createMinimalUsersArray(
    userDoc: DocumentSnapshot,
    currentUser: User
  ): MinimalUser[] {
    const userData = userDoc.data();

    if (userData) {
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
    }
    return [];
  }
}
