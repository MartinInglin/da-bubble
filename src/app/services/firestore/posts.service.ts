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
   * This function saves a post if the user sends it.
   *
   * @param files attached files the user wants to store, type file array
   * @param currentUser type user
   * @param message message the user wants to stores, type string
   * @param path direct messages, threads or channels as string
   * @param selectedChannel object of type channel
   * @param selectedDirectMessage object of type direct message
   * @param selectedThread object of type thread
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
    try {
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

      if (docRef) {
        const post = this.createPost(
          postId,
          currentUser,
          message,
          minimalFiles,
          this.getUTXTimestamp()
        );
        await updateDoc(docRef, { posts: arrayUnion(post) });

        if (path === 'threads') {
          this.updateTimeAndAmountAnswersInChannel(
            docRef,
            selectedChannel,
            selectedThread
          );
        }
      }
    } catch (error) {
      console.error('Error saving post: ', error);
    }
  }

  /**
   * This function creates an object with all the data needed for the new post.
   *
   * @param postId string
   * @param currentUser type user
   * @param message string
   * @param minimalFiles array of minimalized files
   * @param timestamp UTX timestamp of the post
   * @returns
   */
  createPost(
    postId: string,
    currentUser: User,
    message: string,
    minimalFiles: MinimalFile[],
    timestamp: number
  ): Post {
    return {
      id: postId,
      name: currentUser.name,
      avatar: currentUser.avatar,
      message: message,
      timestamp: timestamp,
      reactions: [],
      edited: false,
      files: minimalFiles,
      userId: currentUser.id,
    };
  }

  /**
   * This function updates the channel properties amount answers and the last response time.
   *
   * @param docRef document reference of the thread
   * @param selectedChannel object of type channel
   * @param selectedThread object of type tread
   */
  async updateTimeAndAmountAnswersInChannel(
    docRef: DocumentReference,
    selectedChannel: Channel,
    selectedThread: Thread
  ) {
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

  /**
   * This function returns the amount of posts in a thread minus 1 because the initial post does not count as an answer.
   *
   * @param threadData object of type thread
   * @returns number of posts minus one or zero.
   */
  async getAmountPosts(threadData: Thread): Promise<number> {
    if (threadData) {
      return threadData.posts.length - 1;
    }
    return 0;
  }

  /**
   * This function returns the timestamp of the last post in a thread.
   *
   * @param threadData object of type thread
   * @param amountPosts number
   * @returns UTX timestamp of the last post as number
   */
  async getTimestampLastPost(
    threadData: Thread,
    amountPosts: number
  ): Promise<number> {
    if (threadData) {
      return threadData.posts[amountPosts].timestamp;
    }
    return 0;
  }

  /**
   * This function updates the channel of a corresponding thread so the amount of answers and the last time somebody answered can be displayed.
   *
   * @param channelId string
   * @param amountPosts number
   * @param timestampLastPost number
   * @param postId string
   */
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

  /**
   * This function returns a document reference according to the path inserted.
   *
   * @param path string of either channels, directMessages or threads
   * @param selectedChannel object of type channel
   * @param selectedDirectMessage object of type direct message
   * @param selectedThread object of type thread
   * @returns document for the asked path
   */
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

      if (docSnap.exists()) {
        const docData = docSnap.data();
        const posts: Post[] = docData['posts'];

        if (postIndex >= posts.length || postIndex < 0) {
          const currentPost = posts[postIndex];

          if (currentPost.message !== newMessage) {
            posts[postIndex] = {
              ...currentPost,
              message: newMessage,
              edited: true,
            };

            await updateDoc(docRef, { posts });
          }
        }
      }
    } catch (error) {
      console.error('Error updating post: ', error);
    }
  }

  /**
   * This function deletes a file a user stored in his post.
   *
   * @param indexPost number
   * @param pathToDocument
   * @param indexFile
   */
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
          }
        }
      }
    } catch (error) {
      console.error('Error deleting file: ', error);
    }
  }

  /**
   * This function gets the index of a post in a channel by its ID.
   *
   * @param postId string
   * @param documentId string
   * @returns index of the post as number
   */
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

  /**
   * This function checks if a thread already exists. It is needed because the document for a thread is just created when the thread is opened for the first time.
   *
   * @param documentId string
   * @returns boolean
   */
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

  /**
   * This function stores a reaction a user gives on a comment.
   *
   * @param reaction object of type reaction
   * @param path string of type channels, directMessages or threads
   * @param documentId string
   * @param currentUser object of type user
   * @param indexPost number
   */
  async saveReaction(
    reaction: Reaction,
    path: string,
    documentId: string,
    currentUser: User,
    indexPost: number
  ) {
    try {
      const documentRef = doc(this.firestore, path, documentId);
      const document = await getDoc(documentRef);
      const documentData = document.data();

      if (documentData) {
        let reactions: Reaction[] =
          documentData['posts'][indexPost]['reactions'];
        const indexReaction = this.getIndexReaction(reaction, reactions);

        if (indexReaction !== -1) {
          reactions.splice(indexReaction, 1);
        } else {
          reactions.push(reaction);
          this.usersService.saveUsedEmoji(currentUser.id, reaction.emoji);
        }

        const updatedPosts = documentData['posts'];
        updatedPosts[indexPost]['reactions'] = reactions;

        await updateDoc(documentRef, { posts: updatedPosts });
      } else {
        console.error('Document data is undefined.');
      }
    } catch (error) {
      console.error('Error saving reaction: ', error);
    }
  }

  /**
   * This function gets the index of a reaction.
   *
   * @param reaction object of type reaction
   * @param reactions array of reactions
   * @returns index of reaction as number
   */
  getIndexReaction(reaction: Reaction, reactions: Reaction[]): number {
    for (let i = 0; i < reactions.length; i++) {
      const storedReaction = reactions[i];
      if (this.reactionsEqual(storedReaction, reaction)) {
        return i;
      }
    }
    return -1;
  }

  /**
   * This function checks if this exact same reaction already exists on the post.
   *
   * @param storedReaction object of type reaction
   * @param reaction object of type reaction
   * @returns boolean
   */
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
