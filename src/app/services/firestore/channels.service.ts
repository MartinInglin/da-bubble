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
import { MinimalUser } from '../../interfaces/minimal-user';
import { Post } from '../../models/post.class';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../models/user.class';

@Injectable({
  providedIn: 'root',
})
export class ChannelsService {
  firestore = inject(Firestore);

  private channelSubject: BehaviorSubject<Channel | null> =
    new BehaviorSubject<Channel | null>(null);

  public channelSubject$: Observable<Channel | null> =
    this.channelSubject.asObservable();

  constructor() {}

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

  getAllChannels() {
    const collectionRef = collection(this.firestore, 'channels');
    onSnapshot(collectionRef, (snapshot) => {
      const channel = snapshot.docs.map(
        (doc) => new Channel({ id: doc.id, ...doc.data() })
      )[0]; // Erhalte nur das erste Kanalobjekt
      this.channelSubject.next(channel);
    });
  }

  async createChannel(
    name: string,
    description: string,
    users: MinimalUser[]
  ): Promise<void> {
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

  async removeUserFromChannel(channelId: string, currentUserId: string): Promise<void> {
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

    console.log('User removed from channel and channel deleted if no users left');
  }

  getIndexOfChannel(channels: any[], channelId: string): number {
    return channels.findIndex((channel: any) => channel.id === channelId);
  }

  getIndexOfUser(users: any[], userId: string): number {
    return users.findIndex((user: any) => user.id === userId);
  }

  checkIfChannelNoUsers(channelId: string, channelData: Channel) {
    if (channelData.users.length == 0) {
      this.deleteChannel(channelId);
    }
  }

  async deleteChannel(channelId: string) {
    await deleteDoc(doc(this.firestore, 'channels', channelId));
  }

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

  async savePost(channelId: string, message: string, currentUser: User) {
    const channelRef = doc(this.firestore, 'channels', channelId);

    const post: Post = {
      id: this.createId(),
      name: currentUser.name,
      avatar: currentUser.avatar,
      message: message,
      timestamp: this.getUTXTimestamp(),
      reactions: [],
      edited: false,
    };

    await updateDoc(channelRef, { posts: arrayUnion(post) });
  }

  createId(): string {
    return uuidv4();
  }

  getUTXTimestamp(): number {
    return Date.now();
  }

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
}
