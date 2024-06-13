import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { Channel } from '../../../models/channel.class';
import { User } from '../../../models/user.class';
import { ChannelsService } from '../../../services/firestore/channels.service';
import { Firestore } from '@angular/fire/firestore';
import { StorageService } from '../../../services/storage.service';
import { Thread } from '../../../models/thread.class';
import { DirectMessage } from '../../../models/direct-message.class';
import { PostsService } from '../../../services/firestore/posts.service';

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
  postsService = inject(PostsService);

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

  /**
   * saves the post
   */
  savePost() {
    this.postsService.savePost(
      this.files,
      this.currentUser,
      this.message,
      this.path,
      this.selectedChannel,
      this.selectedDirectMessage,
      this.selectedThread
    );
    this.message = '';
    this.files = [];
  }

  /**
   * opens the file dialog
   */
  openFileDialog() {
    this.fileInput.nativeElement.click();
  }

  /**
   * selects a file
   */
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.files.push(file);
      console.log('File added', this.files);
      input.value = '';
    }
  }

  /**
   * rewmoves file
   */
  removeFile(index: number) {
    this.files.splice(index, 1);
    console.log('File removed', this.files);
  }

  /**
   * adds emoji to message
   */
  addEmojiToMessage(emoji: string): void {
    this.message += emoji;
  }

  /**
   *links contacts name in message
   */
  linkContactInMessage(userName: string) {
    this.message += '@' + userName + ' ';
  }
}
