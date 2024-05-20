import { Injectable, inject } from '@angular/core';
import { Firestore, arrayUnion, collection, doc, getDoc, setDoc, updateDoc } from '@angular/fire/firestore';
import { Thread } from '../../models/thread.class';
import { Post } from '../../models/post.class';
import { Channel } from '../../models/channel.class';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../models/user.class';

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

  async savePost(channelId: string, threadId: string, message: string, currentUser: User) {
    const channelRef = doc(this.firestore, 'channels', channelId);
    const threadRef = doc(channelRef, 'threads', threadId);

    const post: Post = {
      id: this.createId(),
      name: currentUser.name,
      avatar: currentUser.avatar,
      message: message,
      timestamp: this.getUTXTimestamp(),
      reactions: [],
      edited: false,
    };

    await updateDoc(threadRef, { posts: arrayUnion(post) });
  }

  createId(): string {
    return uuidv4();
  }

  getUTXTimestamp(): number {
    return Date.now();
  }

  async editPost(channelId: string, threadId: string, postIndex: number, newMessage: string): Promise<void> {
    try {
      const channelRef = doc(this.firestore, 'channels', channelId);
      const threadRef = doc(channelRef, 'threads', threadId);

      const threadDoc = await getDoc(threadRef);
      if (!threadDoc.exists()) {
        console.error('Thread does not exist');
        return;
      }

      const threadData = threadDoc.data();
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

      await updateDoc(threadRef, { posts });

      console.log('Post successfully updated!');
    } catch (error) {
      console.error('Error updating post: ', error);
    }
  }
}
