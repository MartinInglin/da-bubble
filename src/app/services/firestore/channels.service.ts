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
import { Post } from '../../models/post.class';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../models/user.class';
import { Reaction } from '../../models/reaction.class';
import { StorageService } from '../storage.service';
import { MinimalFile } from '../../interfaces/minimal_file';

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
        console.log(channelData);
      }
    );
  }

  /**
   *
   */
  // getAllChannels() {
  //   const collectionRef = collection(this.firestore, 'channels');
  //   onSnapshot(collectionRef, (snapshot) => {
  //     const channel = snapshot.docs.map(
  //       (doc) => new Channel({ id: doc.id, ...doc.data() })
  //     )[5];
  //     this.channelSubject.next(channel);
  //   });
  // }

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
  ): Promise<void> {
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
    this.addChannelToUsers(channelData.id, channelData.name, userIds);
  }

  currentUserToMinimalUser(currentUser: User): MinimalUser[] {
    const users = [
      {
        name: currentUser.name,
        avatar: currentUser.avatar,
        id: currentUser.id,
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
    const docRef = doc(this.firestore, 'channels', channelId);

    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      await updateDoc(docRef, changes);
    } else {
      console.log('No such document!');
    }

    if (changes.name) {
      this.changeNameChannelOnUsers(changes.name, channelId);
    }
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

  /**
   * This function saves a post a user writes in a channel.
   *
   * @param channelId string
   * @param message string
   * @param currentUser object of type user.
   */
  async savePost(
    channelId: string,
    message: string,
    currentUser: User,
    files: File[]
  ) {
    const channelRef = doc(this.firestore, 'channels', channelId);

    const minimalFiles: MinimalFile[] = this.filesToMinimalFiles(files);

    const post: Post = {
      id: this.createId(),
      name: currentUser.name,
      avatar: currentUser.avatar,
      message: message,
      timestamp: this.getUTXTimestamp(),
      reactions: [],
      edited: false,
      files: minimalFiles,
    };
    await updateDoc(channelRef, { posts: arrayUnion(post) });
  }

  filesToMinimalFiles(files: File[]): MinimalFile[] {
    return files.map((file) => {
      return {
        name: file.name,
        url: file.webkitRelativePath,
      };
    });
  }

  /**
   * This function creates a unique id.
   *
   * @returns id as string
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
   * This function is there if the user edits a post. The timestamp is updated and the variable edited is set to true so a message (edited) can be displayed.
   *
   * @param channelId string
   * @param postIndex number
   * @param newMessage string
   * @returns -
   */
  async editPost(
    channelId: string,
    postIndex: number,
    newMessage: string
  ): Promise<void> {
    try {
      const channelRef = doc(this.firestore, 'channels', channelId);

      const channelDoc = await getDoc(channelRef);
      if (!channelDoc.exists()) {
        console.error('Thread does not exist');
        return;
      }

      const channelData = channelDoc.data();
      const posts: Post[] = channelData['posts'];

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

      await updateDoc(channelRef, { posts });

      console.log('Post successfully updated!');
    } catch (error) {
      console.error('Error updating post: ', error);
    }
  }

  async saveReaction(
    currentUser: User,
    channelId: string,
    postIndex: number,
    reactionIcon: string
  ) {
    const channelRef = doc(this.firestore, 'channels', channelId);
    const channelDoc = await getDoc(channelRef);

    if (!channelDoc.exists()) {
      console.error('Thread does not exist');
      return;
    }

    const channelData = channelDoc.data();
    const post: Post = channelData['posts'][postIndex];

    const reactionIndex = this.userHasCommented(currentUser.id, post);

    if (typeof reactionIndex === 'number') {
      post.reactions[reactionIndex].reaction = reactionIcon;
    } else {
      this.createNewReaction(currentUser, reactionIcon, post);
    }
  }

  userHasCommented(currentUserId: string, post: Post): boolean | number {
    for (let i = 0; i < post.reactions.length; i++) {
      if (post.reactions[i].userId === currentUserId) {
        return i;
      }
    }
    return false;
  }

  createNewReaction(currentUser: User, reactionIcon: string, post: Post) {
    const reaction: Reaction = {
      userName: currentUser.name,
      userId: currentUser.id,
      reaction: reactionIcon,
    };

    post.reactions.push(reaction);
  }

  async saveFileOnPost(channelId: string, postIndex: number, file: File) {
    const channelRef = doc(this.firestore, channelId);
    const channelDoc = await getDoc(channelRef);
    const channelData = channelDoc.data();

    if (channelData) {
      const posts = channelData['posts'] || [];
      const post: Post = posts[postIndex];

      const fileData: MinimalFile = {
        name: file.name,
        url: file.webkitRelativePath,
      };

      post.files.push(fileData);

      await setDoc(channelRef, { posts }, { merge: true });

      const postId = post.id;
      this.storageService.saveFile(postId, file);
    }
  }
}
