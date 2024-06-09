import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  runTransaction,
  setDoc,
  updateDoc,
  writeBatch,
} from '@angular/fire/firestore';
import { Channel } from '../../models/channel.class';
import { BehaviorSubject, Observable } from 'rxjs';
import { MinimalUser } from '../../models/minimal_user.class';
import { User } from '../../models/user.class';
import { StorageService } from '../storage.service';
import { PostsService } from './posts.service';

@Injectable({
  providedIn: 'root',
})
export class ChannelsService {
  firestore = inject(Firestore);
  storageService = inject(StorageService);
  postsService = inject(PostsService);

  private channelSubject: BehaviorSubject<Channel | null> =
    new BehaviorSubject<Channel | null>(null);

  public channelSubject$: Observable<Channel | null> =
    this.channelSubject.asObservable();

  constructor() {}

  /**
   * This function gets the data of a selected channel. It therefore needs the id of the requested channel. The data is provided as an observable that any component can subscribe to.
   *
   * @param idChannel string
   */
  getDataChannel(idChannel: string) {
    const unsub = onSnapshot(
      doc(this.firestore, 'channels', idChannel),
      (doc) => {
        const channelData = doc.data() as Channel;
        this.channelSubject.next(channelData);
        console.log(channelData);
      }
    );
  }

  /**
   *
   */
  getAllChannels() {
    const collectionRef = collection(this.firestore, 'channels');
    onSnapshot(collectionRef, (snapshot) => {
      const channel = snapshot.docs.map(
        (doc) => new Channel({ id: doc.id, ...doc.data() })
      )[5];
      this.channelSubject.next(channel);
    });
  }

  /**
   * This function creates a new channel. It therefore needs a name, a description and the users which a minimalized. For display purposes they need an id, a name and the URL of their avatar.
   *
   * @param name string
   * @param description string
   * @param users object as MinimalUser which contains id as string, name as string an avatar URL as string.
   */
  async createChannel(
    name: string,
    description: string,
    currentUser: User
  ): Promise<Channel> {
    const users = this.currentUserToMinimalUser(currentUser);

    const channelRef = collection(this.firestore, 'channels');
    const newDocRef = doc(channelRef);

    const channelData: Channel = {
      id: newDocRef.id,
      name: name,
      description: description,
      users: users,
      posts: [],
    };

    await setDoc(newDocRef, channelData);
    const userIds = users
      .map((user) => user.id)
      .filter((id): id is string => !!id);
    await this.addChannelToUsers(channelData.id, channelData.name, userIds);

    return channelData;
  }

  currentUserToMinimalUser(currentUser: User): MinimalUser[] {
    const users = [
      {
        name: currentUser.name,
        avatar: currentUser.avatar,
        id: currentUser.id,
        email: currentUser.email,
      },
    ];
    return users;
  }

  /**
   * This function adds the newly created channel to the users. So on every user there is stored to which channels he has access.
   *
   * @param channelId string
   * @param name string
   * @param userIds array of strings
   */
  async addChannelToUsers(channelId: string, name: string, userIds: string[]) {
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

  async getUserById(userId: string): Promise<User> {
    const userDocRef = doc(this.firestore, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      throw new Error('User does not exist');
    }

    return userDoc.data() as User;
  }

  async countUsersInChannel(channelId: string): Promise<number> {
    const channelDocRef = doc(this.firestore, 'channels', channelId);
    const channelDoc = await getDoc(channelDocRef);

    if (!channelDoc.exists()) {
      throw new Error('Channel does not exist');
    }

    const channelData = channelDoc.data() as Channel;
    return channelData.users.length;
  }

  /**
   * This function removes a user from a channel. There are two processes going on. On one hand the user is removed from the channel and on the other hand the channel is removed from the user. If there is no user in the channel left, then the channel is deleted. The runTransaction guarantees that data is consistent if a transaction fails.
   *
   * @param channelId string
   * @param currentUserId string
   */
  async removeUserFromChannel(
    channelId: string,
    currentUserId: string
  ): Promise<void> {
    const channelDocRef = doc(this.firestore, 'channels', channelId);
    const userDocRef = doc(this.firestore, 'users', currentUserId);

    await runTransaction(this.firestore, async (transaction) => {
      const channelDoc = await transaction.get(channelDocRef);
      const userDoc = await transaction.get(userDocRef);

      if (!channelDoc.exists()) {
        throw new Error('Channel does not exist');
      }

      if (!userDoc.exists()) {
        throw new Error('User does not exist');
      }

      const channelData = channelDoc.data() as Channel;
      const users = channelData.users || [];
      const userIndex = this.getIndexOfUser(users, currentUserId);

      if (userIndex === -1) {
        throw new Error('User not found in channel');
      }

      users.splice(userIndex, 1);
      transaction.update(channelDocRef, { users });

      if (users.length === 0) {
        transaction.delete(channelDocRef);
      }

      const userData = userDoc.data();
      const channels = userData['channels'] || [];
      const channelIndex = this.getIndexOfChannel(channels, channelId);

      if (channelIndex !== -1) {
        channels.splice(channelIndex, 1);
        transaction.update(userDocRef, { channels });
      }
    });

    console.log(
      'User removed from channel and channel deleted if no users left'
    );
  }

  /**
   * This function gets the index of a channel stored on the user.
   *
   * @param channels array
   * @param channelId string
   * @returns
   */
  getIndexOfChannel(channels: Channel[], channelId: string): number {
    return channels.findIndex((channel: Channel) => channel.id === channelId);
  }

  /**
   * This function gets the index of a user stored on the channel.
   *
   * @param users array
   * @param userId string
   * @returns
   */
  getIndexOfUser(users: MinimalUser[], userId: string): number {
    return users.findIndex((user: MinimalUser) => user.id === userId);
  }

  /**
   * This function checks if there are any users left on the channel. If there are no more users the channel document is deleted.
   *
   * @param channelId  string
   * @param channelData object
   */
  checkIfChannelNoUsers(channelId: string, channelData: Channel) {
    if (channelData.users.length == 0) {
      this.deleteChannel(channelId);
    }
  }

  /**
   * This function deletes a channels document.
   *
   * @param channelId string
   */
  async deleteChannel(channelId: string) {
    await deleteDoc(doc(this.firestore, 'channels', channelId));
  }

  async updateChannel(
    channelId: string,
    name: string,
    description: string
  ): Promise<void> {
    try {
      const changes = {
        name: name,
        description: description,
      };
      await this.changePropertiesChannel(channelId, changes);
    } catch (error) {
      console.error('Error updating channel:', error);
      throw error;
    }
  }

  /**
   * This function changes the properties of a channel like its name, its users or its description. The changes can be sent partially so the object does not have to be complete.
   *
   * @param channelId string
   * @param changes object of class Channel which can be partial
   */
  async changePropertiesChannel(
    channelId: string,
    changes: Partial<Channel>
  ): Promise<void> {
    try {
      const docRef = doc(this.firestore, 'channels', channelId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        await updateDoc(docRef, changes);
      } else {
        console.log('No such document!');
        throw new Error('Channel document does not exist');
      }

      if (changes.name) {
        await this.changeNameChannelOnUsers(changes.name, channelId);
      }
    } catch (error) {
      console.error('Error updating channel properties:', error);
      throw error; // Rethrow the error for handling in the calling code
    }
  }

  /**
   * This function retrieves the users in a specific channel.
   *
   * @param channelId string
   * @returns Promise<MinimalUser[]>
   */
  async getUsersInChannel(channelId: string): Promise<MinimalUser[]> {
    const channelDocRef = doc(this.firestore, 'channels', channelId);
    const channelDoc = await getDoc(channelDocRef);

    if (!channelDoc.exists()) {
      throw new Error('Channel does not exist');
    }

    const channelData = channelDoc.data() as Channel;
    return channelData.users;
  }

  /**
   * This function changes the name of the channel stored on the users.
   *
   * @param newNameChannel string
   * @param channelId string
   */
  async changeNameChannelOnUsers(
    newNameChannel: string,
    channelId: string
  ): Promise<void> {
    const collectionRef = collection(this.firestore, 'users');
    const querySnapshot = await getDocs(collectionRef);

    const batch = writeBatch(this.firestore);

    querySnapshot.forEach((docSnapshot) => {
      const userData = docSnapshot.data() as User;
      const channels = userData.channels;

      let updated = false;

      const updatedChannels = channels.map((channel) => {
        if (channel.id === channelId) {
          updated = true;
          return { ...channel, name: newNameChannel };
        }
        return channel;
      });

      if (updated) {
        const userDocRef = doc(this.firestore, 'users', docSnapshot.id);
        batch.update(userDocRef, { channels: updatedChannels });
      }
    });

    await batch.commit();
  }

  async addSingleUserToChannel(
    channelId: string,
    user: MinimalUser
  ): Promise<void> {
    const channelDocRef = doc(this.firestore, 'channels', channelId);
    const channelDoc = await getDoc(channelDocRef);

    if (!channelDoc.exists()) {
      throw new Error('Channel does not exist');
    }

    const channelData = channelDoc.data() as Channel;
    const users = channelData.users || [];

    if (!users.some((u: MinimalUser) => u.id === user.id)) {
      users.push(user);
      await updateDoc(channelDocRef, { users });
    } else {
      console.log(`User ${user.name} is already in channel ${channelId}`);
    }
  }

  async addAllUsersToChannel(channelId: string): Promise<void> {
    const collectionRef = collection(this.firestore, 'users');
    const querySnapshot = await getDocs(collectionRef);

    const batch = writeBatch(this.firestore);

    const channelDocRef = doc(this.firestore, 'channels', channelId);
    const channelDoc = await getDoc(channelDocRef);

    if (!channelDoc.exists()) {
      throw new Error('Channel does not exist');
    }

    const channelData = channelDoc.data() as Channel;
    const existingUserIds = channelData.users.map((user) => user.id);

    querySnapshot.forEach((docSnapshot) => {
      const userData = docSnapshot.data() as User;
      if (!existingUserIds.includes(userData.id)) {
        const minimalUser: MinimalUser = {
          id: userData.id,
          name: userData.name,
          avatar: userData.avatar,
          email: userData.email,
        };
        channelData.users.push(minimalUser);
        const userDocRef = doc(this.firestore, 'users', userData.id);
        batch.update(userDocRef, {
          channels: arrayUnion({ id: channelId, name: channelData.name }),
        });
      }
    });

    batch.update(channelDocRef, { users: channelData.users });

    await batch.commit();
    console.log('All users added to the channel.');
  }

  async getChannelById(channelId: string): Promise<Channel | null> {
    try {
      const channelDocRef = doc(this.firestore, 'channels', channelId);
      const channelDoc = await getDoc(channelDocRef);

      if (channelDoc.exists()) {
        return channelDoc.data() as Channel;
      } else {
        console.error('Channel does not exist');
        return null;
      }
    } catch (error) {
      console.error('Error fetching channel:', error);
      return null;
    }
  }
}
