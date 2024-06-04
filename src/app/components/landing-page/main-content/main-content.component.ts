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
import { Subscription, of } from 'rxjs';
import { User } from '../../../models/user.class';
import { UsersService } from '../../../services/firestore/users.service';
import { ThreadsService } from '../../../services/firestore/threads.service';
import { Channel } from '../../../models/channel.class';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import {
  MatDialog,
  MatDialogModule,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { ChannelInfoComponent } from '../../dialogues/channel-info/channel-info.component';
import { MembersComponent } from '../../dialogues/members/members.component';
import { AddUserToChannelComponent } from '../../dialogues/add-user-to-channel/add-user-to-channel.component';
import { ProfileDetailViewComponent } from '../../dialogues/profile-detail-view/profile-detail-view.component';
import { DirectMessagesService } from '../../../services/firestore/direct-messages.service';
import { DirectMessage } from '../../../models/direct-message.class';
import { StorageService } from '../../../services/storage.service';
import { FormsModule } from '@angular/forms';
import { Post } from '../../../models/post.class';
import { StateService } from '../../../services/stateservice.service';
import { SearchService } from '../../../services/search-service.service';
import { Observable } from 'rxjs';
import { PostComponent } from '../post/post.component';

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
    ReactiveFormsModule,
    PostComponent
  ],
  templateUrl: './main-content.component.html',
  styleUrl: './main-content.component.scss',
})
export class MainContentComponent implements OnInit, OnDestroy {

  @Output() toggleThread = new EventEmitter<void>();

  @ViewChild('fileInput') fileInput!: ElementRef;

  channelsService = inject(ChannelsService);
  usersService = inject(UsersService);
  storageService = inject(StorageService);
  message: any = '';
  stateService = inject(StateService);
  // searchService = inject(SearchService);

  private userSubscription: Subscription = new Subscription();
  private channelSubscription: Subscription = new Subscription();
  private usersSubscription: Subscription = new Subscription();
  private directMessageSubscription: Subscription = new Subscription();

  currentUser: User = new User();
  selectedChannel: Channel = new Channel();

  allUsers: User[] = [];
  userCount: number = 0;
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
  form: FormGroup;
  searchResults$: Observable<(Channel | User)[]> = of([]);
  searchResults: (Channel | User)[] | undefined;

  constructor(
    private dialog: MatDialog,
    private directMessagesService: DirectMessagesService,
    private fb: FormBuilder,
    private searchService: SearchService,

  ) {
    this.form = this.fb.group({
      recipient: [''],
    });

  }

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
          this.getUserCount();
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

    this.stateService.showContacts$.subscribe(show => {
      this.chatSelected = show;
    });

    this.stateService.showChannels$.subscribe(show => {
      this.channelSelected = show;
    });


    this.searchResults$ = this.form.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((term) => this.searchService.search(term))
    );

    this.searchResults$.subscribe(results => {
      this.searchResults = results;
    });
  }

  get recipient(): FormControl {
    return this.form.get('recipient') as FormControl;
  }

  selectRecipient(recipient: Channel | User) {
    const recipientString: any =
      recipient instanceof Channel
        ? `#${recipient.name}`
        : `@${recipient.id}`;
    this.form.setValue(recipientString);
  }



  linkContactInMessage(x: string) {
    let messageTextarea = document.getElementById('message-textarea');
    if (messageTextarea) {
      messageTextarea.textContent += '@' + x + ' '; // Append the name to the textarea with a space
    }
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


  openChannelInfoDialog(channelId: string): void {
    const dialogRef = this.dialog.open(ChannelInfoComponent, {
      width: '872px',
      position: {
        top: '11%',
        right: '25%'
      },
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
        top: '11%',
        right: '6%',
      },
      data: { channelId: channelId },
    });
  }

  openAddUserToChannelDialog(channelId: string) {
    const dialogRef = this.dialog.open(AddUserToChannelComponent, {
      width: '800px',
      height: '800px',
      position: {
        top: '210px',
        right: '-200px',
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

  addEmojiToMessage(emoji: string): void {
    this.message += emoji;
  }

  openThread() {
    this.toggleThread.emit();
  }

  async getUserCount(): Promise<void> {
    try {
      if (this.selectedChannel && this.selectedChannel.id) {
        this.userCount = await this.channelsService.countUsersInChannel(this.selectedChannel.id);
      }
    } catch (error) {
      console.error('Error fetching user count:', error);
    }
  }
}
