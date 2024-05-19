import { Injectable, inject } from '@angular/core';
import { Firestore, arrayUnion, collection, doc, getDoc, onSnapshot, setDoc, updateDoc } from '@angular/fire/firestore';
import { Channel } from '../../models/channel.class';
import { User } from '../../models/user.class';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChannelsService {
  firestore = inject(Firestore);

  private channelSubject: BehaviorSubject<Channel | null> =
  new BehaviorSubject<Channel | null>(null);
public channelSubject$: Observable<Channel | null> =
  this.channelSubject.asObservable();

  constructor() { }

  async createChannel(name: string, users: Partial<User>[]): Promise<void> {
    const channelRef = collection(this.firestore, 'channels');
    const newDocRef = doc(channelRef);

    const channelData: Channel = {
      id: newDocRef.id,
      name: name,
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

  async removeUserFromChannel(channelId: string, currentUserId:string): Promise<void> {
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

    const channelDocRef = doc(this.firestore, 'channels', channelId)
    const channelDoc = await getDoc(channelDocRef)

    if (channelDoc.exists()) {
      const channelData = channelDoc.data();
      const users = channelData['users'] || [];

      const indexOfUser = this.getIndexOfUser(users, currentUserId)

      if (indexOfUser !== -1) {
        users.splice(indexOfUser, 1);

        await updateDoc(channelDocRef, {users: users})
      }
    }
  }
  
  getIndexOfChannel(channels: any[], channelId: string): number {
    return channels.findIndex((channel: any) => channel.id === channelId);
  }

  getIndexOfUser(users: any[], userId: string): number {
    return users.findIndex((user:any) => user.id === userId);
  }

  getDataChannel(idChannel:string) {
    const unsub = onSnapshot(doc(this.firestore, 'channels', idChannel), (doc) => {
      const channelData = doc.data() as Channel;
      this.channelSubject.next(channelData);
      console.log(channelData);
      
    });
  }
}
