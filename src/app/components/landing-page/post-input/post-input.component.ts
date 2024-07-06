import { Component, ElementRef, Input, SimpleChanges, ViewChild, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
export class PostInputComponent implements OnInit {
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
    '😊', '❤️', '😂', '🎉', '🌟', '🎈', '🌈', '🍕', '🚀', '⚡',
  ];
  message: string = '';

  allChannels: Channel[] = [];
  showUserList: boolean = false;
  showChannelList: boolean = false;
  filteredUsers: User[] = [];
  filteredChannels: Channel[] = [];

  /**
   * Lifecycle hook that is called after the component is initialized.
   * Calls the loadChannels method to load all available channels.
   */
  ngOnInit(): void {
    this.loadChannels();
  }

  /**
  * Lifecycle hook that is called after the component's view has been fully initialized.
  * Sets the focus on the message text area.
  */
  ngAfterViewInit(): void {
    this.setFocus();
  }

  /**
  * Lifecycle hook that is called when any data-bound property of a directive changes.
  * If there are changes in the selected IDs, it sets the focus on the message text area.
  * 
  * @param changes - The changes in the data-bound properties.
  */
  ngOnChanges(changes: SimpleChanges): void {
    if (this.idChanges(changes)) {
      this.setFocus();
    }
  }

  /**
  * Checks if there are changes in the selected IDs for channel, direct message, or thread.
  * 
  * @param changes - The changes in the data-bound properties.
  * @returns A boolean indicating whether there are changes in the selected IDs.
  */
  idChanges(changes: SimpleChanges): boolean {
    return (
      (changes['selectedChannel'] &&
        changes['selectedChannel'].currentValue.id !== changes['selectedChannel'].previousValue?.id) ||
      (changes['selectedDirectMessage'] &&
        changes['selectedDirectMessage'].currentValue.id !== changes['selectedDirectMessage'].previousValue?.id) ||
      (changes['selectedThread'] &&
        changes['selectedThread'].currentValue.id !== changes['selectedThread'].previousValue?.id)
    );
  }

  /**
  * Sets the focus on the message text area after a short delay.
  * The timeout ensures the DOM is fully rendered before setting the focus.
  */
  setFocus() {
    setTimeout(() => {
      if (this.messageTextarea) {
        this.messageTextarea.nativeElement.focus();
      }
    }, 10);
  }

  /**
  * Saves a post by calling the savePost method in the posts service.
  * If the message is empty, shows a snackbar message.
  */
  savePost() {
    if (/^\s*$/.test(this.message)) {
      this.snackbarService.openSnackBar('Bitte schreibe eine Nachricht.', 'Schliessen');
    } else {
      this.postsService.savePost(
        this.files, this.currentUser, this.message, this.path, this.selectedChannel, this.selectedDirectMessage, this.selectedThread
      );
      this.message = '';
      this.files = [];
    }
  }

  /**
  * Opens the file dialog to allow the user to select files.
  */
  openFileDialog() {
    this.fileInput.nativeElement.click();
  }

  /**
  * Handles the file selection event.
  * Adds the selected file to the local files array if it meets the criteria.
  * 
  * @param event - The file selection event.
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
  * Removes a file from the local files array.
  * 
  * @param index - The index of the file to be removed.
  */
  removeFile(index: number) {
    this.files.splice(index, 1);
  }

  /**
  * Adds an emoji to the message.
  * 
  * @param emoji - The emoji to be added.
  */
  addEmojiToMessage(emoji: string): void {
    this.message += emoji;
  }

  /**
  * Adds a user's mention to the message.
  * 
  * @param userName - The username to be mentioned.
  */
  linkContactInMessage(userName: string) {
    this.message += '@' + userName + ' ';
  }

  /**
  * Handles the key up event in the message text area.
  * Filters the users or channels based on the input query.
  * 
  * @param event - The keyboard event.
  */
  onKeyUp(event: KeyboardEvent) {
    const target = event.target as HTMLTextAreaElement;
    const cursorPosition = target.selectionStart;
    const textBeforeCursor = target.value.substring(0, cursorPosition);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
    const lastHashSymbol = textBeforeCursor.lastIndexOf('#');

    if (lastAtSymbol !== -1 && (lastHashSymbol === -1 || lastAtSymbol > lastHashSymbol)) {
      const query = textBeforeCursor.substring(lastAtSymbol + 1);
      if (query.length > 0) {
        this.showUserList = true;
        this.showChannelList = false;
        this.filteredUsers = this.allUsers.filter(user => user.name.toLowerCase().includes(query.toLowerCase()));
      } else {
        this.showUserList = false;
      }
    } else if (lastHashSymbol !== -1) {
      const query = textBeforeCursor.substring(lastHashSymbol + 1);
      if (query.length > 0) {
        this.showChannelList = true;
        this.showUserList = false;
        this.filteredChannels = this.allChannels.filter(channel => channel.name.toLowerCase().includes(query.toLowerCase()));
      } else {
        this.showChannelList = false;
      }
    } else {
      this.showUserList = false;
      this.showChannelList = false;
    }
  }

  /**
  * Selects a user from the filtered list and adds their mention to the message.
  * 
  * @param user - The selected user.
  */
  selectUser(user: User) {
    const cursorPosition = this.messageTextarea.nativeElement.selectionStart;
    const textBeforeCursor = this.message.substring(0, cursorPosition);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
    const textAfterCursor = this.message.substring(cursorPosition);

    if (lastAtSymbol !== -1) {
      const textBeforeAt = this.message.substring(0, lastAtSymbol);
      this.message = textBeforeAt + '@' + user.name + ' ' + textAfterCursor;
      this.showUserList = false;
      this.filteredUsers = [];
      setTimeout(() => {
        this.messageTextarea.nativeElement.setSelectionRange(
          textBeforeAt.length + user.name.length + 2,
          textBeforeAt.length + user.name.length + 2
        );
      }, 0);
    }
  }

  /**
  * Selects a channel from the filtered list and adds its mention to the message.
  * 
  * @param channel - The selected channel.
  */
  selectChannel(channel: Channel) {
    const cursorPosition = this.messageTextarea.nativeElement.selectionStart;
    const textBeforeCursor = this.message.substring(0, cursorPosition);
    const lastHashSymbol = textBeforeCursor.lastIndexOf('#');
    const textAfterCursor = this.message.substring(cursorPosition);

    if (lastHashSymbol !== -1) {
      const textBeforeHash = this.message.substring(0, lastHashSymbol);
      this.message = textBeforeHash + '#' + channel.name + ' ' + textAfterCursor;
      this.showChannelList = false;
      this.filteredChannels = [];
      setTimeout(() => {
        this.messageTextarea.nativeElement.setSelectionRange(
          textBeforeHash.length + channel.name.length + 2,
          textBeforeHash.length + channel.name.length + 2
        );
      }, 0);
    }
  }

  /**
  * Loads all available channels using the ChannelsService.
  */
  loadChannels() {
    this.channelsService.getAllChannels().subscribe(channels => {
      this.allChannels = channels;
    });
  }
}
