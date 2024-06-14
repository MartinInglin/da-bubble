import { Injectable, inject } from '@angular/core';
import {
  DocumentReference,
  Firestore,
  arrayUnion,
  doc,
  getDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { Post } from '../../models/post.class';
import { v4 as uuidv4 } from 'uuid';
import { StorageService } from '../storage.service';
import { MinimalFile } from '../../models/minimal_file.class';
import { User } from '../../models/user.class';
import { Channel } from '../../models/channel.class';
import { DirectMessage } from '../../models/direct-message.class';
import { Thread } from '../../models/thread.class';
import { ThreadsService } from './threads.service';
import { Reaction } from '../../models/reaction.class';
import { UsersService } from './users.service';
import { ChannelsService } from './channels.service';

@Injectable({
  providedIn: 'root',
})
export class PostsService {
  firestore = inject(Firestore);
  storageService = inject(StorageService);
  usersService = inject(UsersService);
  threadsService = inject(ThreadsService);
  channelsService = inject(ChannelsService);

  constructor() {}

  /**
   * This function saves a post a user writes in a channel, direct message or thread.
   *
   */
  async savePost(
    files: File[],
    currentUser: User,
    message: string,
    path: 'directMessages' | 'threads' | 'channels',
    selectedChannel: Channel,
    selectedDirectMessage: DirectMessage,
    selectedThread: Thread
  ) {
    const postId = this.createId();
    const minimalFiles: MinimalFile[] = await this.storageService.saveFiles(
      postId,
      files
    );

    const docRef = this.getDocRef(
      path,
      selectedChannel,
      selectedDirectMessage,
      selectedThread
    );

    if (!docRef) {
      console.error('Document reference is undefined.');
      return;
    }

    const post: Post = {
      id: postId,
      name: currentUser.name,
      avatar: currentUser.avatar,
      message: message,
      timestamp: this.getUTXTimestamp(),
      reactions: [],
      edited: false,
      files: minimalFiles,
      userId: currentUser.id,
    };
    await updateDoc(docRef, { posts: arrayUnion(post) });

    if (path === 'threads') {
      const document = await getDoc(docRef);
      const data = document.data();
      const threadData = data as Thread;

      const amountPosts: number = await this.getAmountPosts(threadData);
      const timestampLastPost: number = await this.getTimestampLastPost(
        threadData,
        amountPosts
      );
      this.updateAmountAnswersAndTime(
        selectedChannel.id,
        amountPosts,
        timestampLastPost,
        selectedThread.posts[0].id
      );
    }
  }

  async getAmountPosts(threadData: Thread): Promise<number> {
    if (threadData) {
      return threadData.posts.length - 1;
    }
    return 0;
  }

  async getTimestampLastPost(
    threadData: Thread,
    amountPosts: number
  ): Promise<number> {
    if (threadData) {
      return threadData.posts[amountPosts].timestamp;
    }
    return 0;
  }

  async updateAmountAnswersAndTime(
    channelId: string,
    amountPosts: number,
    timestampLastPost: number,
    postId: string
  ) {
    const indexPost: number = await this.getIndexPostInChannel(
      postId,
      channelId
    );
    const documentRef = doc(this.firestore, 'channels', channelId);
    const document = await getDoc(documentRef);
    const data = document.data();

    if (data) {
      const posts: Post[] = data['posts'];

      if (indexPost >= 0 && indexPost < posts.length) {
        posts[indexPost].amountAnswers = amountPosts;
        posts[indexPost].lastAnswer = timestampLastPost;

        await updateDoc(documentRef, { posts });
      }
    }
  }

  getDocRef(
    path: string,
    selectedChannel: Channel,
    selectedDirectMessage: DirectMessage,
    selectedThread: Thread
  ): DocumentReference | undefined {
    if (path === 'channels') {
      return doc(this.firestore, path, selectedChannel.id);
    }
    if (path === 'directMessages') {
      return doc(this.firestore, path, selectedDirectMessage.id);
    }
    if (path === 'threads') {
      return doc(this.firestore, path, selectedThread.id);
    }
    console.error('Invalid path or missing ID.');
    return undefined;
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
   * This function is needed if a user edits a post. The timestamp is updated and the variable "edited" is set to true so edited can be displayed.
   *
   * @param channelId string
   * @param threadId string
   * @param postIndex number
   * @param newMessage string
   * @returns object as post
   */
  async editPost(
    path: string,
    documentId: string,
    postIndex: number,
    newMessage: string
  ): Promise<void> {
    try {
      const docRef = doc(this.firestore, path, documentId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        console.error('Document does not exist');
        return;
      }

      const docData = docSnap.data();
      const posts: Post[] = docData['posts'];

      if (postIndex >= posts.length || postIndex < 0) {
        console.error('Invalid post index');
        return;
      }

      const currentPost = posts[postIndex];

      if (currentPost.message !== newMessage) {
        posts[postIndex] = {
          ...currentPost,
          message: newMessage,
          timestamp: this.getUTXTimestamp(),
          edited: true,
        };

        await updateDoc(docRef, { posts });
      }
    } catch (error) {
      console.error('Error updating post: ', error);
    }
  }


  async deleteFile(
    indexPost: number,
    pathToDocument: string,
    indexFile: number
  ) {
    try {
      const docRef = doc(this.firestore, pathToDocument);
      const document = await getDoc(docRef);
      const documentData = document.data();
      if (documentData && documentData['posts']) {
        if (indexPost >= 0 && indexPost < documentData['posts'].length) {
          const post = documentData['posts'][indexPost];
          if (post.files && indexFile >= 0 && indexFile < post.files.length) {
            post.files.splice(indexFile, 1);
            await updateDoc(docRef, { posts: documentData['posts'] });
            console.log(
              `File at index ${indexFile} in post at index ${indexPost} deleted successfully.`
            );
          } else {
            console.error('Invalid indexFile: Index out of bounds.');
          }
        } else {
          console.error('Invalid indexPost: Index out of bounds.');
        }
      } else {
        console.error('No data found or posts array is missing.');
      }
    } catch (error) {
      console.error('Error deleting file: ', error);
    }
  }

  async getIndexPostInChannel(
    postId: string,
    documentId: string
  ): Promise<number> {
    try {
      const docRef = doc(this.firestore, 'channels', documentId);
      const document = await getDoc(docRef);
      const documentData = document.data();

      if (documentData && documentData['posts']) {
        for (let i = 0; i < documentData['posts'].length; i++) {
          if (documentData['posts'][i].id === postId) {
            return i;
          }
        }
      }
      return -1;
    } catch (error) {
      console.error('Error getting index of channel', error);
      return -1;
    }
  }

  async checkIfThreadExists(documentId: string): Promise<boolean> {
    try {
      const docRef = doc(this.firestore, 'threads', documentId);
      const document = await getDoc(docRef);

      if (document.exists()) {
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking for thread data', error);
      return false;
    }
  }

  async saveReaction(
    reaction: Reaction,
    path: string,
    documentId: string,
    currentUser: User,
    indexPost: number
  ) {
    const documentRef = doc(this.firestore, path, documentId);
    const document = await getDoc(documentRef);
    const documentData = document.data();
    if (documentData) {
      let reactions: Reaction[] = documentData['posts'][indexPost]['reactions'];
      const indexReaction = this.checkIfReactionExists(reaction, reactions);
      if (indexReaction !== -1) {
        reactions.splice(indexReaction, 1);
      } else {
        reactions.push(reaction);
        this.usersService.saveUsedEmoji(currentUser.id, reaction.emoji);
      }
      const updatedPosts = documentData['posts'];
      updatedPosts[indexPost]['reactions'] = reactions;

      await updateDoc(documentRef, { posts: updatedPosts });
    }
  }

  checkIfReactionExists(reaction: Reaction, reactions: Reaction[]): number {
    for (let i = 0; i < reactions.length; i++) {
      const storedReaction = reactions[i];
      if (this.reactionsEqual(storedReaction, reaction)) {
        return i;
      }
    }
    return -1;
  }

  reactionsEqual(storedReaction: Reaction, reaction: Reaction): boolean {
    if (
      storedReaction.userId === reaction.userId &&
      storedReaction.userName === reaction.userName &&
      storedReaction.emoji === reaction.emoji
    ) {
      return true;
    }
    return false;
  }
}
