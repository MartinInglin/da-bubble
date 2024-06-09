import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { Channel } from '../../../models/channel.class';
import { User } from '../../../models/user.class';
import { ChannelsService } from '../../../services/firestore/channels.service';
import { v4 as uuidv4 } from 'uuid';
import { DocumentReference, Firestore, arrayUnion, doc, updateDoc } from '@angular/fire/firestore';
import { StorageService } from '../../../services/storage.service';
import { Post } from '../../../models/post.class';
import { MinimalFile } from '../../../models/minimal_file.class';
import { Thread } from '../../../models/thread.class';
import { DirectMessage } from '../../../models/direct-message.class';

@Component({
  selector: 'app-post-input',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatMenuModule, FormsModule],
  templateUrl: './post-input.component.html',
  styleUrl: './post-input.component.scss',
})
export class PostInputComponent {
  channelsService = inject(ChannelsService);
  storageService = inject(StorageService);
  firestore = inject(Firestore);

  @Input() selectedChannel!: Channel;
  @Input() selectedDirectMessage!: DirectMessage;
  @Input() selectedThread!: Thread;
  @Input() allUsers!: User[];
  @Input() currentUser!: User;

  @Input() path!: 'directMessages' | 'threads' | 'channels';

  @ViewChild('fileInput') fileInput!: ElementRef;

  files: File[] = [];
  emojis: string[] = [
    '😊',
    '❤️',
    '😂',
    '🎉',
    '🌟',
    '🎈',
    '🌈',
    '🍕',
    '🚀',
    '⚡',
  ];
  message: string = '';



  openFileDialog() {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event) {
    debugger;
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.files.push(file);
      console.log("File added", this.files);
      input.value = '';
    }
  }

  removeFile(index: number) {
    this.files.splice(index, 1);
    console.log("File removed", this.files);
  }

  addEmojiToMessage(emoji: string): void {
    this.message += emoji;
  }

  /**
   * This function writes the name of a user into the textarea, if the user selects one in the @ user menu.
   * 
   * @param userName Name of the user the from the list that opens if a click on the @ symbol happens.
   */
  linkContactInMessage(userName: string) {
      this.message += '@' + userName + ' ';
    }

  /**
   * This function saves a post a user writes in a channel.
   *
   */
  async savePost() {
    const postId = this.createId();
    const minimalFiles: MinimalFile[] = await this.storageService.saveFiles(
      postId,
      this.files
    );

    const docRef = this.getDocRef();

    if (!docRef) {
      console.error('Document reference is undefined.');
      return;
    }

    const post: Post = {
      id: postId,
      name: this.currentUser.name,
      avatar: this.currentUser.avatar,
      message: this.message,
      timestamp: this.getUTXTimestamp(),
      reactions: [],
      edited: false,
      files: minimalFiles,
      userId: this.currentUser.id,
    };
    await updateDoc(docRef, { posts: arrayUnion(post) });
    this.message = '';
    this.files = [];
  }

  getDocRef(): DocumentReference | undefined {
    const channelId = this.selectedChannel.id;

    if (this.path === 'channels') {
      return doc(this.firestore, this.path, channelId);
    }
    if (this.path === 'directMessages') {
      const directMessageId = this.selectedDirectMessage.id;
      return doc(this.firestore, this.path, directMessageId);
    }
    if (this.path === 'threads') {
      const threadId = this.selectedThread.id;
      return doc(this.firestore, 'channels', channelId, this.path, threadId);
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
}
