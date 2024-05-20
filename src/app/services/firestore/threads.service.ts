import { Injectable, inject } from '@angular/core';
import { Firestore, arrayUnion, collection, doc, setDoc, updateDoc } from '@angular/fire/firestore';
import { Thread } from '../../models/thread.class';
import { Post } from '../../models/post.class';
import { Channel } from '../../models/channel.class';

@Injectable({
  providedIn: 'root',
})
export class ThreadsService {
  firestore = inject(Firestore);

  constructor() {}

  async createThread(channelData: Channel, postIndex:number): Promise<void> {
    debugger;
    try {
      const channelRef = doc(this.firestore, 'channels', channelData.id);
      const threadsCollectionRef = collection(channelRef, 'threads');

      const post:Post = channelData.posts[postIndex]

      const threadData: Thread = {
        id: post.id,
        name: channelData.name,
        posts: [post],
      };

      const threadDocRef = doc(threadsCollectionRef, post.id);
      await setDoc(threadDocRef, threadData);
      console.log('Thread successfully created!');
    } catch (error) {
      console.error('Error creating thread: ', error);
    }
  }
}
