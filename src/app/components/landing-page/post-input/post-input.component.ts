import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  SimpleChanges,
  ViewChild,
  inject,
} from '@angular/core';
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
import { SnackbarService } from '../../../services/snackbar.service';

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
  snackbarService = inject(SnackbarService);
  readonly maxFileSize = 0.5 * 1024 * 1024;

  @Input() selectedChannel!: Channel;
  @Input() selectedDirectMessage!: DirectMessage;
  @Input() selectedThread!: Thread;
  @Input() allUsers!: User[];
  @Input() currentUser!: User;

  @Input() path!: 'directMessages' | 'threads' | 'channels';

  @ViewChild('fileInput') fileInput!: ElementRef;
  @ViewChild('messageTextarea') messageTextarea!: ElementRef;

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

  ngAfterViewInit(): void {
    this.setFocus();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.idChanges(changes)) {
      this.setFocus();
    }
  }

  /**
   * This function checks if ID's changed. Only if so the focus should be set.
   *
   * @param changes changes
   * @returns boolean
   */
  idChanges(changes: SimpleChanges): boolean {
    return (
      (changes['selectedChannel'] &&
        changes['selectedChannel'].currentValue.id !==
          changes['selectedChannel'].previousValue?.id) ||
      (changes['selectedDirectMessage'] &&
        changes['selectedDirectMessage'].currentValue.id !==
          changes['selectedDirectMessage'].previousValue?.id) ||
      (changes['selectedThread'] &&
        changes['selectedThread'].currentValue.id !==
          changes['selectedThread'].previousValue?.id)
    );
  }

  /**
   * This function sets the focus to the text area. The timeout is needed to make sure that the DOM is fully created before setting the focus.
   */
  setFocus() {
    setTimeout(() => {
      if (this.messageTextarea) {
        this.messageTextarea.nativeElement.focus();
      }
    }, 10);
  }

  /**
   * This function saves a post by calling the savePost function in the posts service.
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
   * This function opens the file dialog which allows the user to upload files.
   */
  openFileDialog() {
    this.fileInput.nativeElement.click();
  }

  /**
   * This file adds the file to the local file array.
   *
   * @param event event
   */
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      if (
        file.type === 'image/jpeg' ||
        file.type === 'image/png' ||
        file.type === 'application/pdf'
      ) {
        if (file.size <= this.maxFileSize) {
          this.files.push(file);
          input.value = '';
        } else {
          this.snackbarService.openSnackBar(
            'Die Datei ist zu groß. Bitte wähle eine Datei, die kleiner als 500 kB ist.',
            'Schliessen'
          );
        }
      } else {
        this.snackbarService.openSnackBar(
          'Es können nur Bilder (jpg oder png) und PDFs gespeichert werden.',
          'Schliessen'
        );
      }
    }
  }

  /**
   * This function removes a file from the local file array.
   */
  removeFile(index: number) {
    this.files.splice(index, 1);
  }

  /**
   * This function adds an emoji to a message
   *
   * @param emoji string
   */
  addEmojiToMessage(emoji: string): void {
    this.message += emoji;
  }

  /**
   * This function adds another user to the message and prints @ username into the message.
   *
   * @param userName string of the user selected in the menu
   */
  linkContactInMessage(userName: string) {
    this.message += '@' + userName + ' ';
  }
}
