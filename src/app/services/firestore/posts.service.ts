import { Injectable, inject } from '@angular/core';
import {
  DocumentReference,
  Firestore,
  arrayUnion,
  collection,
  getDocs,
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
import { Observable, catchError, from, of, combineLatest } from 'rxjs';
import { map, mergeMap, toArray } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class PostsService {
  firestore = inject(Firestore);
  storageService = inject(StorageService);
  usersService = inject(UsersService);
  threadsService = inject(ThreadsService);
  channelsService = inject(ChannelsService);

  constructor() { }

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
            selectedDirectMessage,
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
    selectedDirectMessage: DirectMessage,
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

    let documentID: string = '';
    let path: string = '';
    if (this.containsThreadId(selectedChannel, selectedThread.id)) {
      documentID = selectedChannel.id;
      path = 'channels';
    } else if (this.containsThreadId(selectedDirectMessage, selectedThread.id)) {
      documentID = selectedDirectMessage.id;
      path = 'directMessages';
    }
    this.updateAmountAnswersAndTime(
      documentID,
      amountPosts,
      timestampLastPost,
      selectedThread.posts[0].id,
      path
    );
  }

  /**
   * This function checks if the thread Id exists in a channel or a direct message post. If so it returns true.
   * 
   * @param selectedChannelOrDirectMessage object of type channel or direct message
   * @param selectedThreadId string
   * @returns boolean
   */
  containsThreadId(selectedChannelOrDirectMessage: Channel | DirectMessage, selectedThreadId: string): boolean {
    for (let i = 0; i < selectedChannelOrDirectMessage.posts.length; i++) {
      let postId = selectedChannelOrDirectMessage.posts[i].id;
      if (postId === selectedThreadId) {
        return true
      }
    } return false
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
    documentId: string,
    amountPosts: number,
    timestampLastPost: number,
    postId: string,
    path: string
  ) {
    const indexPost: number = await this.getIndexPostInChannel(
      postId,
      documentId,
      path
    );
    const documentRef = doc(this.firestore, path, documentId);
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

        if (postIndex >= 0) {
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
    documentId: string,
    localPath: string
  ): Promise<number> {
    try {
      const docRef = doc(this.firestore, localPath, documentId);
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

/**
 * Retrieves a post by its ID from channels or directMessages collections.
 * 
 * @param {string} id - The ID of the post to retrieve.
 * @returns {Observable<{ post: Post, path: string, channelId: string } | undefined>} - The post or undefined if not found.
 */
getPostById(id: string): Observable<{ post: Post, path: string, channelId: string } | undefined> {
  return from(this.getPostFromCollection('channels', id)).pipe(
    mergeMap(result => result ? of(result) : this.getPostFromCollection('directMessages', id)),
    catchError((error) => {
      console.error('Error getting post:', error);
      return of(undefined);
    })
  );
}

private async getPostFromCollection(collectionName: 'channels' | 'directMessages', id: string): Promise<{ post: Post, path: string, channelId: string } | undefined> {
  try {
    const collectionRef = collection(this.firestore, collectionName);
    const querySnapshot = await getDocs(collectionRef);

    for (const docSnap of querySnapshot.docs) {
      const docData = docSnap.data();
      const posts: Post[] = docData['posts'];

      if (posts) {
        const post = posts.find(p => p.id === id);
        if (post) {
          return { post, path: collectionName, channelId: docSnap.id };
        }
      }
    }
    return undefined;
  } catch (error) {
    console.error(`Error getting post from ${collectionName}`, error);
    return undefined;
  }
}


  /**
   * Retrieves all posts from channels and direct messages that the current user is part of.
   *
   * @param userChannels - Array of channel IDs the user is part of
   * @param userDirectMessages - Array of direct message IDs the user is part of
   * @returns Observable with an array of all posts
   */
  getAllPostsForUser(userChannels: string[], userDirectMessages: string[]): Observable<Post[]> {
    const pathsAndIds: Array<{ path: 'channels' | 'directMessages'; id: string }> = [
      ...userChannels.map(id => ({ path: 'channels' as const, id })),
      ...userDirectMessages.map(id => ({ path: 'directMessages' as const, id }))
    ];

    return from(pathsAndIds).pipe(
      mergeMap(({ path, id }) => this.getPosts(path, id).pipe(
        map(posts => posts.map(post => ({ ...post, channelId: id, path }))) // Channel ID und Path hinzufügen
      )),
      toArray(),
      map(postsArrays => postsArrays.flat())
    );
  }

  /**
   * Retrieves posts based on the provided path and document ID.
   *
   * @param path - Path to the document ('channels' or 'directMessages')
   * @param documentId - ID of the document to retrieve posts from
   * @returns Array of posts or an empty array if not found
   */
  getPosts(path: 'channels' | 'directMessages', documentId: string): Observable<Post[]> {
    return from(this.getPostsPromise(path, documentId)).pipe(
      catchError((error) => {
        console.error('Error getting posts: ', error);
        return of([]);
      })
    );
  }

  private async getPostsPromise(path: 'channels' | 'directMessages', documentId: string): Promise<Post[]> {
    try {
      const docRef = doc(this.firestore, path, documentId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const docData = docSnap.data();
        const posts = docData['posts'] || [];
        return posts.map((post: Post) => ({
          ...post,
          channelId: documentId,
          path,
        }));
      } else {
        console.log('No such document!');
        return [];
      }
    } catch (error) {
      return [];
    }
  }
}


