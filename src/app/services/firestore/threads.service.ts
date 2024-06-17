import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  onSnapshot,
  setDoc,
} from '@angular/fire/firestore';
import { Thread } from '../../models/thread.class';
import { Post } from '../../models/post.class';
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

  /**
   * This function gets the data of a selected thread.
   * 
   * @param channelName string
   * @param post object of type post
   */
  getDataThread(channelName: string, post: Post) {
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
