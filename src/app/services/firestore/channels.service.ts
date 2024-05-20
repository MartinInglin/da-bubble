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
    this.addUsersToChannel(channelData.id, channelData.name, userIds);
  }

  async addUsersToChannel(channelId: string, name: string, userIds: string[]) {
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

  async removeUserFromChannel(
    channelId: string,
    currentUserId: string
  ): Promise<void> {
    if (currentUserId) {
      const userDocRef = doc(this.firestore, 'users', currentUserId);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const channels = userData['channels'] || [];

        const indexOfChannel = this.getIndexOfChannel(channels, channelId);

        if (indexOfChannel !== -1) {
          channels.splice(indexOfChannel, 1);

          await updateDoc(userDocRef, { channels: channels });
        }
      }
    }

    const channelDocRef = doc(this.firestore, 'channels', channelId);
    const channelDoc = await getDoc(channelDocRef);

    if (channelDoc.exists()) {
      const channelData = channelDoc.data();
      const users = channelData['users'] || [];

      const indexOfUser = this.getIndexOfUser(users, currentUserId);

      if (indexOfUser !== -1) {
        users.splice(indexOfUser, 1);

        await updateDoc(channelDocRef, { users: users });
      }
    }
  }

  getIndexOfChannel(channels: any[], channelId: string): number {
    return channels.findIndex((channel: any) => channel.id === channelId);
  }

  getIndexOfUser(users: any[], userId: string): number {
    return users.findIndex((user: any) => user.id === userId);
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
      edited: false
    };

    await updateDoc(channelRef, { posts: arrayUnion(post) });
  }

  createId(): string {
    return uuidv4();
  }

  getUTXTimestamp(): number {
    return Date.now();
  }

  async editPost(channelId: string, postIndex: number, newMessage: string): Promise<void> {
    try {
      const channelRef = doc(this.firestore, 'channels', channelId);

      const channelDoc = await getDoc(channelRef);
      if (!channelDoc.exists()) {
        console.error('Thread does not exist');
        return;
      }

      const threadData = channelDoc.data();
      const posts: Post[] = threadData['posts'];

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
