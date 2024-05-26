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
import { DirectMessage } from '../../../models/direct_message.class';
import { StorageService } from '../../../services/storage.service';
import { FormsModule } from '@angular/forms';

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
    FormsModule
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
  channelSelected: boolean = true;
  chatSelected: boolean = false;
  files: File[] = [];
  message: string = '';

  constructor(
    private dialog: MatDialog,
    private threadService: ThreadsService,
    private directMessagesService: DirectMessagesService
  ) {}

  // @Output() openThreadEvent = new EventEmitter<boolean>(); // Event to signal thread opening

  @Output() openThreadEvent: EventEmitter<boolean> =
    new EventEmitter<boolean>();

  ngOnInit(): void {
    this.userSubscription = this.usersService.currentUser$.subscribe((user) => {
      this.currentUser = user ?? new User();
    });
    this.channelSubscription = this.channelsService.channelSubject$.subscribe(
      (channel) => {
        this.selectedChannel = channel ?? new Channel();
        console.log("Current channel:", this.selectedChannel);
        
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
    this.openThreadEvent.emit();
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    if (this.channelSubscription) {
      this.channelSubscription.unsubscribe();
    }
    if (this.usersSubscription) {
      this.usersSubscription.unsubscribe(); // Benutzerabonnement aufheben
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

  onClickCreateThread(channelData: Channel, postIndex: number): void {
    this.openThreadEvent.emit(true); // Hier wird das Event ausgelöst
    this.threadService
      .createThread(channelData, postIndex)
      .then(() => {
        console.log('Thread erfolgreich erstellt!');
      })
      .catch((error) => {
        console.error('Fehler beim Erstellen des Threads: ', error);
      });
  }

  openChannelInfoDialog(channelId: string): void {
    const dialogRef = this.dialog.open(ChannelInfoComponent, {
      width: '872px',
      data: { channelId: channelId },
    });
  }

  openMembersDialog(): void {
    const dialogRef = this.dialog.open(MembersComponent, {
      width: '415px',
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
    const hours = date.getHours(); // Hole die Stunden aus dem Datum
    const minutes = date.getMinutes(); // Hole die Minuten aus dem Datum
    // const seconds = date.getSeconds(); // Hole die Sekunden aus dem Datum
    return ` ${hours}:${minutes} Uhr`; // Gib die Uhrzeit im Format "Stunden:Minuten:Sekunden" zurück
  }

  savePost() {
    debugger;
    this.channelsService.savePost(
      this.selectedChannel.id,
      this.message,
      this.currentUser,
      this.files
    );
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
}
