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
import { Channel } from '../../models/channel.class';
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
    const threadId = post.id

    const unsub = onSnapshot(
      doc(this.firestore, 'channels', channelId, 'threads', threadId),
      (doc) => {
        const threadData = doc.data() as Thread;
        if (!doc.exists()) {
          this.createThread(channelId, channelName, post)
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
  async createThread(channelId: string, channelName: string, firstPost: Post): Promise<void> {
    try {
      const channelRef = doc(this.firestore, 'channels', channelId);
      const threadsCollectionRef = collection(channelRef, 'threads');

      const post: Post = firstPost;

      const threadData: Thread = {
        id: post.id,
        name: channelName,
        posts: [post],
      };

      const threadDocRef = doc(threadsCollectionRef, post.id);
      await setDoc(threadDocRef, threadData);
      console.log('Thread successfully created!');
    } catch (error) {
      console.error('Error creating thread: ', error);
    }
  }

  /**
   * This function saves a post on a thread.
   *
   * @param channelId string
   * @param threadId string
   * @param message string
   * @param currentUser object as user
   */
  async savePost(
    channelId: string,
    threadId: string,
    message: string,
    currentUser: User
  ) {
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
      files: [],
      userId: currentUser.id,
    };

    await updateDoc(threadRef, { posts: arrayUnion(post) });
  }

  /**
   * This function creates a unique ID. It is needed to store the post in the document.
   * @returns ID as string
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
   * This function is needed if a user edits a post. The timestamp is updated and the variable "edited" is set to true so edited can be displayed.
   *
   * @param channelId string
   * @param threadId string
   * @param postIndex number
   * @param newMessage string
   * @returns object as post
   */
  async editPost(
    channelId: string,
    threadId: string,
    postIndex: number,
    newMessage: string
  ): Promise<void> {
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

  async saveReaction(
    currentUser: User,
    directMessageId: string,
    postIndex: number,
    reactionIcon: string
  ) {
    const directMessageRef = doc(this.firestore, 'channels', directMessageId);
    const directMessageDoc = await getDoc(directMessageRef);

    if (!directMessageDoc.exists()) {
      console.error('Thread does not exist');
      return;
    }

    const directMessageData = directMessageDoc.data();
    const post: Post = directMessageData['posts'][postIndex];

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
}
