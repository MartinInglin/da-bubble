import {
  Component,
  EventEmitter,
  Output,
  Input,
  inject,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { ChannelsService } from '../../../services/firestore/channels.service';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { User } from '../../../models/user.class';
import { UsersService } from '../../../services/firestore/users.service';
import { ThreadsService } from '../../../services/firestore/threads.service';
import { Channel } from '../../../models/channel.class';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import {
  MatDialog,
  MatDialogModule,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { ChannelInfoComponent } from '../../channel-info/channel-info.component';
import { MembersComponent } from '../../members/members.component';
import { ProfileDetailViewComponent } from '../../profile-detail-view/profile-detail-view.component';
import { DirectMessagesService } from '../../../services/firestore/direct-messages.service';
import { DirectMessage } from '../../../models/direct-message.class';
import { StorageService } from '../../../services/storage.service';
import { FormsModule } from '@angular/forms';
// import { ThreadComponent } from '../thread/thread.component';

declare const twemoji: any; // Deklariere Twemoji als Modul

@Component({
  selector: 'app-main-content',
  standalone: true,
  imports: [
    RouterModule,
    MatButtonModule,
    MatMenuModule,
    CommonModule,
    MatDialogModule,
    FormsModule,
    // ThreadComponent
  ],
  templateUrl: './main-content.component.html',
  styleUrl: './main-content.component.scss',
})
export class MainContentComponent implements OnInit, OnDestroy {
  // @Output() openThreadEvent: EventEmitter<void> = new EventEmitter<void>();
  @ViewChild('fileInput') fileInput!: ElementRef;

  channelsService = inject(ChannelsService);
  usersService = inject(UsersService);
  threadsService = inject(ThreadsService);
  storageService = inject(StorageService);
  message: any = '';
  // threadComponent = inject(ThreadComponent)

  private userSubscription: Subscription = new Subscription();
  private channelSubscription: Subscription = new Subscription();
  private usersSubscription: Subscription = new Subscription();
  private directMessageSubscription: Subscription = new Subscription();

  currentUser: User = new User();
  selectedChannel: Channel = new Channel();

  allUsers: User[] = [];
  userId: any;
  directMessage: DirectMessage | null = null;
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
  channelSelected: boolean = false;
  chatSelected: boolean = false;
  files: File[] = [];

  constructor(
    private dialog: MatDialog,
    private threadService: ThreadsService,
    private directMessagesService: DirectMessagesService
  ) {}

  @Output() toggleThread: EventEmitter<boolean> =
    new EventEmitter<boolean>();

  ngOnInit(): void {
    this.userSubscription = this.usersService.currentUser$.subscribe((user) => {
      this.currentUser = user ?? new User();
    });

    this.channelSubscription = this.channelsService.channelSubject$.subscribe(
      (channel) => {
        this.selectedChannel = channel ?? new Channel();
        console.log('Current channel:', this.selectedChannel);

        this.channelSelected = !!this.selectedChannel.id;
        if (this.channelSelected) {
          this.chatSelected = false;
          console.log('hallo');
        }
      }
    );

    this.usersSubscription = this.usersService.allUsersSubject$.subscribe(
      (users) => {
        this.allUsers = users ?? []; // Benutzerdaten aktualisieren
      }
    );

    this.directMessageSubscription =
      this.directMessagesService.directMessage$.subscribe(
        (directMessage: DirectMessage | null) => {
          this.directMessage = directMessage;
          console.log(directMessage);

          this.chatSelected = !!directMessage; // Update chatSelected based on the existence of a direct message
          if (this.chatSelected) {
            this.channelSelected = false;
          }
        }
      );
  }

  openThread(): void {
    this.toggleThread.emit(true);
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    if (this.channelSubscription) {
      this.channelSubscription.unsubscribe();
    }
    if (this.usersSubscription) {
      this.usersSubscription.unsubscribe();
    }
    if (this.directMessageSubscription) {
      this.directMessageSubscription.unsubscribe();
    }
  }
  showEmoji(emoji: string): string {
    // Verwende Twemoji.show() oder Twemoji.parse() um das Emoji zu rendern
    return twemoji.parse(emoji);
  }

  linkContactInMessage(x: string) {
    let messageTextarea = document.getElementById('message-textarea');
    if (messageTextarea) {
      messageTextarea.textContent += '@' + x + ' '; // Append the name to the textarea with a space
    }
  }

  // onClickCreateThread(channelData: Channel, postIndex: number): void {
  //   this.openThreadEvent.emit(true); // Hier wird das Event ausgelöst
  //   this.threadService
  //     .createThread(channelData, postIndex)
  //     .then(() => {
  //       console.log('Thread erfolgreich erstellt!');
  //     })
  //     .catch((error) => {
  //       console.error('Fehler beim Erstellen des Threads: ', error);
  //     });
  // }

  openChannelInfoDialog(channelId: string): void {
    const dialogRef = this.dialog.open(ChannelInfoComponent, {
      width: '872px',
      data: { channelId: channelId },
    });
  }

  async sendMessage(): Promise<void> {
    if (this.message.trim()) {
      try {
        await this.channelsService.savePost(
          this.selectedChannel.id,
          this.message,
          this.currentUser,
          this.files
        );
        this.message = '';
        this.files = [];
      } catch (error) {
        console.error('Error posting message:', error);
      }
    }
  }

  savePost() {
    this.channelsService.savePost(
      this.selectedChannel.id,
      this.message,
      this.currentUser,
      this.files
    );
  }

  async sendMessageToContact() {
    if (this.message.trim() && this.directMessage?.id) {
      try {
        await this.directMessagesService.savePost(
          this.directMessage.id,
          this.message,
          this.currentUser
        );
        this.message = '';
        console.log(this.message, 'has ben sent');
      } catch (error) {
        console.error('Error posting Directmessage:', error);
      }
    }
  }

  openMembersDialog(channelId: string): void {
    const dialogRef = this.dialog.open(MembersComponent, {
      width: '415px',
      position: {
        top: '210px',
        right: '100px',
      },
      data: { channelId: channelId },
    });
  }

  openDetailViewDialog(): void {
    const dialogRef = this.dialog.open(ProfileDetailViewComponent, {
      width: '500px',
    });
  }

  formatDate(timestamp: number): string {
    const daysOfWeek = [
      'Sonntag',
      'Montag',
      'Dienstag',
      'Mittwoch',
      'Donnerstag',
      'Freitag',
      'Samstag',
    ];
    const date = new Date(timestamp);
    const today = new Date(); // Aktuelles Datum
    const dayOfWeekIndex = date.getDay(); // Hole den Wochentag als Zahl (0-6)

    // Überprüfe, ob das Datum heute ist
    if (date.toDateString() === today.toDateString()) {
      return 'heute'; // Gib 'heute' zurück, wenn das Datum heute ist
    } else {
      return daysOfWeek[dayOfWeekIndex]; // Andernfalls gib den Namen des Wochentags zurück
    }
  }

  formatDateTime(timestamp: number): string {
    const date = new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes} Uhr`;
  }

  openFileDialog() {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.files.push(file);
      console.log(this.files);
    }
  }

  removeFile(index: number) {
    this.files.splice(index, 1);
  }

  downloadFile(downloadURL: string) {
    this.storageService.getFile(downloadURL);
  }
}
