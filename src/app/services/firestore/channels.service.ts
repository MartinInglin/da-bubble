import { Injectable, inject } from '@angular/core';
import {
  DocumentReference,
  DocumentSnapshot,
  Firestore,
  QuerySnapshot,
  Transaction,
  WriteBatch,
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
import { MinimalChannel } from '../../models/minimal_channel.class';

@Injectable({
  providedIn: 'root',
})
export class ChannelsService {
  firestore = inject(Firestore);
  storageService = inject(StorageService);

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
      }
    );
  }

  /**
   * This function gets the data of all channels and returns an observable.
   */
  getAllChannels(): Observable<Channel[]> {
    return new Observable<Channel[]>((observer) => {
      const collectionRef = collection(this.firestore, 'channels');
      const unsubscribe = onSnapshot(collectionRef, (snapshot) => {
        const channels = snapshot.docs.map(
          (doc) => new Channel({ id: doc.id, ...doc.data() })
        );
        observer.next(channels);
      }, (error) => observer.error(error));

      return () => unsubscribe();
    });
  }

  /**
   * This function creates a new channel.
   *
   * @param name string, name of the channel the user defined
   * @param description string, channel description the user defined
   * @param currentUser User, data of the signed in user
   * @returns
   */
  async createChannel(
    name: string,
    description: string,
    currentUser: User
  ): Promise<Channel> {
    try {
      const users = this.currentUserToMinimalUser(currentUser);
      const channelData = this.buildChannelData(name, description, users);
      const userIds = this.extractUserIds(users);

      await this.saveChannelData(channelData);
      await this.addChannelToUsers(channelData.id, channelData.name, userIds);

      return channelData;
    } catch (error) {
      console.error('Error creating channel:', error);
      throw new Error('Failed to create channel');
    }
  }

  /**
   * This function builds the channel data and returns an object of type channel, added all the information given from the user creating a new channel.
   *
   * @param name string, name of the channel
   * @param description string of channels description
   * @param users array of users of type minimal user
   * @returns updated channel data of type channel
   */
  private buildChannelData(
    name: string,
    description: string,
    users: MinimalUser[]
  ): Channel {
    const newDocRef = doc(collection(this.firestore, 'channels'));
    return {
      id: newDocRef.id,
      name: name,
      description: description,
      users: users,
      posts: [],
      isDirectMessage: false,
      isChannel: false,
    };
  }

  /**
   * This function saves the channel to firestore.
   *
   * @param channelData data of the newly created channel of type channel
   */
  private async saveChannelData(channelData: Channel): Promise<void> {
    try {
      const channelRef = collection(this.firestore, 'channels');
      const newDocRef = doc(channelRef, channelData.id);
      await setDoc(newDocRef, channelData);
    } catch (error) {
      console.error('Error saving channel data:', error);
      throw new Error('Failed to save channel data');
    }
  }

  /**
   * This function filters all the users and returns the user ID's as an array of strings.
   *
   * @param users array of minimal users
   * @returns ID's of the users as strings in an array
   */
  private extractUserIds(users: MinimalUser[]): string[] {
    return users.map((user) => user.id).filter((id): id is string => !!id);
  }

  /**
   * This function returns the current user as a minimal user.
   *
   * @param currentUser user data as type user
   * @returns user data as type minimal user.
   */
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

  /**
   * This function returns the user data by the given user ID.
   *
   * @param userId string
   * @returns user data of type user
   */
  async getUserById(userId: string): Promise<User> {
    const userDocRef = doc(this.firestore, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      throw new Error('User does not exist');
    }

    return userDoc.data() as User;
  }

  /**
   * This function returns the amount of users in the channel with the given ID.
   *
   * @param channelId string
   * @returns number, amount of users in a channel
   */
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
      const { channelDoc, userDoc } = await this.checkDocumentsExist(
        transaction,
        channelDocRef,
        userDocRef
      );

      const channelData = channelDoc.data() as Channel;
      const users = channelData.users || [];
      this.removeUserFromChannelData(users, currentUserId);

      if (users.length === 0) {
        transaction.delete(channelDocRef);
      } else {
        transaction.update(channelDocRef, { users });
      }

      const userData = userDoc.data();
      const channels = userData['channels'] || [];
      this.removeChannelFromUserData(channels, channelId);
      transaction.update(userDocRef, { channels });
    });
  }

  /**
   * This function checks if the document for the channel exists. If it exists it returns the channel document and the user document as an object.
   *
   * @param transaction firebase object of type transaction to keep consistency of the process
   * @param channelDocRef document reference of the selected channel
   * @param userDocRef document reference of the current user
   * @returns object that contains the documents of the channel and the user
   */
  private async checkDocumentsExist(
    transaction: Transaction,
    channelDocRef: DocumentReference,
    userDocRef: DocumentReference
  ) {
    const channelDoc = await transaction.get(channelDocRef);
    const userDoc = await transaction.get(userDocRef);

    if (!channelDoc.exists()) {
      throw new Error('Channel does not exist');
    }

    if (!userDoc.exists()) {
      throw new Error('User does not exist');
    }

    return { channelDoc, userDoc };
  }

  /**
   * This function takes the array users and removes the current user.
   *
   * @param users array of the users assigned to the channel
   * @param currentUserId string
   */
  private removeUserFromChannelData(
    users: MinimalUser[],
    currentUserId: string
  ): void {
    const userIndex = this.getIndexOfUser(users, currentUserId);
    if (userIndex === -1) {
      throw new Error('User not found in channel');
    }
    users.splice(userIndex, 1);
  }

  /**
   * This function takes the array channels which is stored on the user and removes the current channel
   *
   * @param channels array of channels stored on the user
   * @param channelId string
   */
  private removeChannelFromUserData(
    channels: Channel[],
    channelId: string
  ): void {
    const channelIndex = this.getIndexOfChannel(channels, channelId);
    if (channelIndex !== -1) {
      channels.splice(channelIndex, 1);
    }
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

  /**
   * This function updates a channel if the name or the description changes.
   *
   * @param channelId string
   * @param name string, new name the user submits
   * @param description string, new description the user submits
   */
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
      throw error;
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
    const users = await this.fetchAllUsers();
    const batch = writeBatch(this.firestore);

    users.forEach((docSnapshot) => {
      const updatedChannels = this.updateChannelsForUser(
        docSnapshot,
        newNameChannel,
        channelId
      );
      if (updatedChannels) {
        const userDocRef = doc(this.firestore, 'users', docSnapshot.id);
        batch.update(userDocRef, { channels: updatedChannels });
      }
    });

    await batch.commit();
  }

  /**
   * This function gets the whole collection of users from firestore.
   *
   * @returns collection of documents stored in 'users' collection
   */
  private async fetchAllUsers(): Promise<QuerySnapshot> {
    const collectionRef = collection(this.firestore, 'users');
    return await getDocs(collectionRef);
  }

  /**
   * This function updates the channel name to the new name and returns an array of minimal channels.
   *
   * @param docSnapshot document snapshot
   * @param newNameChannel string
   * @param channelId string
   * @returns array of updated minimal channels
   */
  private updateChannelsForUser(
    docSnapshot: DocumentSnapshot,
    newNameChannel: string,
    channelId: string
  ): MinimalChannel[] | null {
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

    return updated ? updatedChannels : null;
  }

  /**
   * This function adds a user to a channel.
   *
   * @param channelId string
   * @param user user added, type minimal user
   */
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

    this.updateUsersFirestore(users, user, channelDocRef, channelId);
  }

  /**
   * This user stores the new channel data on firestore.
   *
   * @param users array of minimal users stored on the channel
   * @param user user to be added as minimal user
   * @param channelDocRef document reference of the channel
   * @param channelId string
   */
  async updateUsersFirestore(
    users: MinimalUser[],
    user: MinimalUser,
    channelDocRef: DocumentReference,
    channelId: string
  ) {
    if (!users.some((u: MinimalUser) => u.id === user.id)) {
      users.push(user);
      await updateDoc(channelDocRef, { users });
    } else {
      console.log(`User ${user.name} is already in channel ${channelId}`);
    }
  }

  /**
   * This function adds all users to a channel. It does this by using a batch to make sure all transactions finish safely.
   *
   * @param channelId string
   */
  async addAllUsersToChannel(channelId: string): Promise<void> {
    const users = await this.fetchAllUsers();
    const channelData = await this.fetchChannelData(channelId);
    const batch = writeBatch(this.firestore);

    const existingUserIds = channelData.users.map((user) => user.id);

    users.forEach((docSnapshot) => {
      const userData = docSnapshot.data() as User;
      if (!existingUserIds.includes(userData.id)) {
        this.addUserToChannelBatch(batch, channelData, userData, channelId);
      }
    });

    const channelDocRef = doc(this.firestore, 'channels', channelId);
    batch.update(channelDocRef, { users: channelData.users });

    await batch.commit();
    console.log('All users added to the channel.');
  }

  /**
   *This function gets the data of the newly created channel.
   *
   * @param channelId string
   * @returns channel data as type channel
   */
  private async fetchChannelData(channelId: string): Promise<Channel> {
    const channelDocRef = doc(this.firestore, 'channels', channelId);
    const channelDoc = await getDoc(channelDocRef);

    if (!channelDoc.exists()) {
      throw new Error('Channel does not exist');
    }

    return channelDoc.data() as Channel;
  }

  /**
   * This function creates writes the batch which is finally stored.
   * 
   * @param batch object of type WriteBatch
   * @param channelData data of the channel, type channel
   * @param userData data of the current user, type user
   * @param channelId string
   */
  private addUserToChannelBatch(
    batch: WriteBatch,
    channelData: Channel,
    userData: User,
    channelId: string
  ): void {
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

  /**
   * This function finds a channel by its ID and returns the channel data.
   * 
   * @param channelId string
   * @returns channel data of type channel
   */
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
