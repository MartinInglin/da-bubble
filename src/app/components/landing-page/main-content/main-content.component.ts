import {
  Component,
  EventEmitter,
  Output,
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
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ChannelInfoComponent } from '../../dialogues/channel-info/channel-info.component';
import { ChannelInfoMobileComponent } from '../../dialogues/mobile/channel-info-mobile/channel-info-mobile.component';
import { MembersComponent } from '../../dialogues/members/members.component';
import { AddUserToChannelComponent } from '../../dialogues/add-user-to-channel/add-user-to-channel.component';
import { ProfileDetailViewComponent } from '../../dialogues/profile-detail-view/profile-detail-view.component';
import { DirectMessagesService } from '../../../services/firestore/direct-messages.service';
import { DirectMessage } from '../../../models/direct-message.class';
import { FormsModule } from '@angular/forms';
import { Post } from '../../../models/post.class';
import { StateService } from '../../../services/stateservice.service';
import { Observable } from 'rxjs';
import { PostComponent } from '../post/post.component';
import { MinimalUser } from '../../../models/minimal_user.class';
import { PostInputComponent } from '../post-input/post-input.component';
import { user } from '@angular/fire/auth';

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
    PostComponent,
    PostInputComponent,
  ],
  templateUrl: './main-content.component.html',
  styleUrl: './main-content.component.scss',
})
export class MainContentComponent implements OnInit, OnDestroy {
  @Output() toggleThread = new EventEmitter<void>();

  @ViewChild('fileInput') fileInput!: ElementRef;

  channelsService = inject(ChannelsService);
  usersService = inject(UsersService);
  stateService = inject(StateService);
  threadsService = inject(ThreadsService);
  directMessagesService = inject(DirectMessagesService);

  private userSubscription: Subscription = new Subscription();
  private channelSubscription: Subscription = new Subscription();
  private usersSubscription: Subscription = new Subscription();
  private directMessageSubscription: Subscription = new Subscription();

  filteredChannels: Channel[] = [];
  currentUser: User = new User();
  selectedChannel: Channel = new Channel();
  selectedDirectMessage: DirectMessage = new DirectMessage();
  otherUserDirectMessage: MinimalUser = new MinimalUser();
  filteredUsers: User[] = [];
  allUsers: User[] = [];
  userCount: number = 0;
  channelSelected: boolean = false;
  chatSelected: boolean = false;
  isDialogOpen: boolean = false;
  form: FormGroup;
  searchTerm: string = '';

  searchResults$: Observable<(Channel | User)[]> = of([]);
  searchResults: (Channel | User)[] | undefined;

  constructor(private dialog: MatDialog, private fb: FormBuilder) {
    this.form = this.fb.group({
      recipient: [''],
    });
  }

  ngOnInit(): void {
    this.userSubscription = this.usersService.currentUser$.subscribe((user) => {
      this.currentUser = user ?? new User();

      const channels: Channel[] = this.currentUser.channels.map(
        (minimalChannel) => new Channel(minimalChannel)
      );

      this.filteredChannels = channels.filter((c) =>
        c.name.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
      this.currentUser = user ?? new User();
    });

    this.channelSubscription = this.channelsService.channelSubject$.subscribe(
      (channel) => {
        if (channel) {
          this.selectedChannel = channel ?? new Channel();

          this.channelSelected = !!this.selectedChannel.id;
          if (this.channelSelected) {
            this.chatSelected = false;
            this.getUserCount();
          }
        }
      }
    );

    this.usersSubscription = this.usersService.allUsersSubject$.subscribe(
      (users) => {
        if (users) {
          this.allUsers = users ?? [];

          this.filteredUsers = this.allUsers.filter((u) =>
            u.name.toLowerCase().includes(this.searchTerm.toLowerCase())
          );
        }
      }
    );

    this.directMessageSubscription =
      this.directMessagesService.directMessage$.subscribe((directMessage) => {
        this.selectedDirectMessage = directMessage ?? new DirectMessage();

        this.chatSelected = !!directMessage;
        if (this.chatSelected) {
          this.channelSelected = false;
        }
        this.getOtherUserDirectMessage();
      });

    this.stateService.showContacts$.subscribe((show) => {
      this.chatSelected = show;
    });

    this.stateService.showChannels$.subscribe((show) => {
      this.channelSelected = show;
    });

    this.searchResults$ = this.form.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((formValue) => {
        const term = formValue.recipient;
        this.searchTerm = typeof term === 'string' ? term : '';
        return this.searchTerm ? this.search(this.searchTerm) : of([]);
      })
    );

    this.searchResults$.subscribe((results) => {
      this.searchResults = results;
    });

    this.searchResults$.subscribe((results) => {
      this.searchResults = results;
    });
  }
  /**
   * This function checks if the given result is a user.
   * @param result - The result to check.
   * @returns True if the result is a user, false otherwise.
   */
  isUser(result: Channel | User): result is User {
    return (result as User).avatar !== undefined;
  }

  /**
   * This function opens a channel based on the given ID.
   * @param x - The ID of the channel to open.
   */
  openChannel(x: string) {
    this.channelsService.getDataChannel(x);
    this.form.get('recipient')?.setValue('');
  }

  /**
   *This function opens a direct message based on the given ID and user.
   * @param x - The ID of the direct message.
   * @param y - The user associated with the direct message.
   */
  openDirectMessage(x: string, y: any) {
    this.directMessagesService.getDataDirectMessage(x, y);
    this.form.get('recipient')?.setValue('');
  }

  /**
   * This function gets the other user in a direct message.
   */
  getOtherUserDirectMessage() {
    for (let i = 0; i < this.selectedDirectMessage.users.length; i++) {
      if (this.selectedDirectMessage.users[i].id != this.currentUser.id) {
        this.otherUserDirectMessage = this.selectedDirectMessage.users[i];
      }
    }
  }

  /**
   * Getter for the recipient form control.
   * @returns The recipient form control.
   */
  get recipient(): FormControl {
    return this.form.get('recipient') as FormControl;
  }

  /**
   * This function selects a recipient (channel or user) and updates the form value.
   * @param recipient - The selected recipient.
   */
  selectRecipient(recipient: Channel | User) {
    const recipientString: any =
      recipient instanceof Channel ? `#${recipient.name}` : `@${recipient.id}`;
    this.form.setValue({ recipient: recipientString });
  }

  /**
   * This function searches for channels or users based on the search term.
   * @param searchTerm - The term to search for.
   * @returns An observable of the search results (channels or users).
   */
  search(searchTerm: string): Observable<(Channel | User)[]> {
    if (searchTerm.startsWith('#')) {
      // Suche nach Kanälen
      const filteredChannels = this.filteredChannels.filter(
        (channel) =>
          channel.name
            .toLowerCase()
            .includes(searchTerm.slice(1).toLowerCase()) &&
          !channel.isDirectMessage // Entfernen Sie "#" aus dem Suchbegriff
      );
      return of(filteredChannels);
    } else if (searchTerm.startsWith('@')) {
      // Suche nach Benutzern
      const filteredUsers = this.allUsers.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.slice(1).toLowerCase()) &&
          !user.isChannel // Entfernen Sie "@" aus dem Suchbegriff
      );
      return of(this.filterCurrentUser(filteredUsers));
    } else {
      return of([]); // Return an empty observable for no matches
    }
  }

  /**
   * This function filters out the current user from the search results.
   * @param results - The search results to filter.
   * @returns The filtered search results.
   */
  private filterCurrentUser(results: (Channel | User)[]): (Channel | User)[] {
    return results.filter((result) => {
      if (this.isUser(result)) {
        return result.id !== this.currentUser.id;
      }
      return true;
    });
  }

  /**
   * Cleanup logic when the component is destroyed.
   */
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

  /**
   * This function opens the channel info dialog for the given channel ID.
   * @param channelId - The ID of the channel.
   */
  openChannelInfoDialog(channelId: string): void {
    if (this.currentUser) {
      if (window.innerWidth <= 750) {
        this.openChannelInfoMobileDialog();
      } else {
        const dialogRef = this.dialog.open(ChannelInfoComponent, {
          width: '872px',
          position: {
            top: '185px',
            right: '180px',
          },
          data: { channelId: channelId },
        });
        dialogRef.componentInstance.currentUser = new User(this.currentUser);

        this.isDialogOpen = true;

        dialogRef.afterClosed().subscribe(() => {
          this.isDialogOpen = false;
        });
      }
    }
  }

  /**
   * This function opens the channel info mobile dialog.
   */
  openChannelInfoMobileDialog(): void {
    if (this.currentUser) {
      const dialogRef = this.dialog.open(ChannelInfoMobileComponent, {
        width: '100%',
        height: '100vh',
      });
      dialogRef.componentInstance.currentUser = new User(this.currentUser);

      this.isDialogOpen = true;

      dialogRef.afterClosed().subscribe(() => {
        this.isDialogOpen = false;
      });
    }
  }

  /**
   * This function opens the members dialog for the given channel ID.
   * @param channelId - The ID of the channel.
   * @param membersDialog - The HTML element for positioning the dialog.
   */
  openMembersDialog(channelId: string, membersDialog: HTMLElement): void {
    const rect = membersDialog.getBoundingClientRect();
    const dialogRef = this.dialog.open(MembersComponent, {
      width: '415px',
      position: {
        top: `${rect.bottom + window.scrollY + 10}px`,
        left: `${rect.left + window.scrollX - 400}px`,
      },
      data: { channelId: channelId },
    });
  }

  /**
   * This function opens the members dialog for the given channel ID.
   * @param channelId - The ID of the channel.
   * @param membersDialog - The HTML element for positioning the dialog.
   */
  openAddUserToChannelDialog(channelId: string, addUserDialog: HTMLElement) {
    const rect = addUserDialog.getBoundingClientRect();
    const dialogRef = this.dialog.open(AddUserToChannelComponent, {
      width: '800px',
      height: '800px',
      position: {
        top: `${rect.bottom + window.scrollY + 10}px`,
        left: `${rect.left + window.scrollX - 475}px`,
      },
      data: { channelId: channelId },
    });
  }

  /**
   * This function opens the add user to channel dialog for the given channel ID.
   * @param channelId - The ID of the channel.
   * @param addUserDialog - The HTML element for positioning the dialog.
   */
  openDetailViewDialog(): void {
    const dialogRef = this.dialog.open(ProfileDetailViewComponent, {
      width: '500px',
    });
  }

  /**
   * This function opens the profile detail view dialog.
   */
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

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    const formattedDate = `${day}.${month}.${year}`;

    // Überprüfe, ob das Datum heute ist
    if (date.toDateString() === today.toDateString()) {
      return 'heute'; // Gib 'heute' zurück, wenn das Datum heute ist
    } else {
      return `${daysOfWeek[dayOfWeekIndex]} ${formattedDate}`; // Andernfalls gib den Namen des Wochentags zurück
    }
  }

  /**
   * This function formats a timestamp into a date and time string.
   * @param timestamp - The timestamp to format.
   * @returns The formatted date and time string.
   */
  formatDateTime(timestamp: number): string {
    const date = new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes} Uhr`;
  }

  /**
   * This function gets the data of a thread if the user clicks on a post in a channel. Then it opens the thread.
   */
  openThread(post: Post) {
    this.getDataThread(post);
    this.toggleThread.emit();
  }

  /**
   * This function gets the data of the thread from the service. The post needs to be transmitted if the thread is openend for the first time. Then a new document is created and the post is stored as the first post.
   */
  getDataThread(post: Post) {
    this.threadsService.getDataThread(
      this.selectedChannel.id,
      this.selectedChannel.name,
      post
    );
  }

  /**
   * This function gets the user count for the selected channel.
   */
  async getUserCount(): Promise<void> {
    try {
      if (this.selectedChannel && this.selectedChannel.id) {
        this.userCount = await this.channelsService.countUsersInChannel(
          this.selectedChannel.id
        );
      }
    } catch (error) {
      console.error('Error fetching user count:', error);
    }
  }
}
