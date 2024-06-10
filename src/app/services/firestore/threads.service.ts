import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  arrayUnion,
  collection,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { Thread } from '../../models/thread.class';
import { Post } from '../../models/post.class';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../models/user.class';
import { Reaction } from '../../models/reaction.class';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ThreadsService {
  firestore = inject(Firestore);

  private threadSubject: BehaviorSubject<Thread | null> =
    new BehaviorSubject<Thread | null>(null);

  public threadSubject$: Observable<Thread | null> =
    this.threadSubject.asObservable();

  constructor() {}

  getDataThread(channelId: string, channelName: string, post: Post) {
    const threadId = post.id;

    const unsub = onSnapshot(
      doc(this.firestore, 'threads', threadId),
      (doc) => {
        const threadData = doc.data() as Thread;
        if (!doc.exists()) {
          this.createThread(channelName, post);
        }
        this.threadSubject.next(threadData);
      }
    );
  }

  /**
   * This function creates a new thread if the user clicks on a post in a channel.
   *
   * @param channelData object as channel
   * @param postIndex number
   */
  async createThread(channelName: string, firstPost: Post): Promise<void> {
    try {
      const threadsCollectionRef = collection(this.firestore, 'threads');

      const post: Post = firstPost;

      const threadData: Thread = {
        id: post.id,
        name: channelName,
        posts: [post],
      };

      const threadDocRef = doc(threadsCollectionRef, post.id);
      await setDoc(threadDocRef, threadData);
    } catch (error) {
      console.error('Error creating thread: ', error);
    }
  }
}
