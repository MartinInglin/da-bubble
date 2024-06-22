import {
  Component,
  EventEmitter,
  Output,
  inject,
  OnInit,
  OnDestroy,
  AfterViewInit,
  AfterViewChecked,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  HostListener,
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
import { AddUserToChannelMobileComponent } from '../../dialogues/mobile/add-user-to-channel-mobile/add-user-to-channel-mobile.component';
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
  styleUrls: ['./main-content.component.scss'],
})
export class MainContentComponent implements OnInit, OnDestroy, AfterViewInit, AfterViewChecked {
  @Output() toggleThread = new EventEmitter<void>();

  @ViewChild('fileInput') fileInput!: ElementRef;
  @ViewChild('channelMessageContent') channelMessageContent!: ElementRef;
  @ViewChild('directMessageContent') directMessageContent!: ElementRef;
  @ViewChild('searchResultsList') searchResultsList!: ElementRef;
  @ViewChild('avatarName') avatarName!: ElementRef;
  @ViewChild(PostInputComponent) postInputComponent!: PostInputComponent;

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

  constructor(
    private dialog: MatDialog,
    private fb: FormBuilder,
    private cdref: ChangeDetectorRef
  ) {
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
            this.scrollToBottomWithDelay();
          }
        }
        this.checkNameWidth();
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
        this.scrollToBottomWithDelay();
        this.checkNameWidth();
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
  }

/**
 * Handles click events on the document to close the search results list if the click is outside of it.
 * 
 * @param {MouseEvent} event - The mouse event that triggered the click.
 * @returns {void}
 */
@HostListener('document:click', ['$event'])
handleClickOutside(event: MouseEvent): void {
  if (
    this.searchResultsList &&
    !this.searchResultsList.nativeElement.contains(event.target)
  ) {
    this.closeSearchResults();
  }
}

  closeSearchResults(): void {
    this.searchResults = [];
    this.form.get('recipient')?.setValue('');
  }

  ngAfterViewInit(): void {
    if (this.channelMessageContent) {
      const channelObserver = new MutationObserver(() => {
        this.scrollToBottom(this.channelMessageContent);
      });
      channelObserver.observe(this.channelMessageContent.nativeElement, {
        childList: true,
      });
    }

    if (this.directMessageContent) {
      const directMessageObserver = new MutationObserver(() => {
        this.scrollToBottom(this.directMessageContent);
      });
      directMessageObserver.observe(this.directMessageContent.nativeElement, {
        childList: true,
      });
    }

    this.cdref.detectChanges(); // Trigger change detection
    this.checkNameWidth();
  }

  /**
   * Checks the width of the name element within the avatarName container.
   * If the width of the name element is greater than 300 pixels,
   * it adds the 'scroll' class to the avatarName container to trigger a scroll animation.
   * If the width is 300 pixels or less, it removes the 'scroll' class.
   *
   * @returns {void}
   */
  checkNameWidth(): void {
    if (this.avatarName && this.avatarName.nativeElement) {
      const nameElement = this.avatarName.nativeElement.querySelector('.header-name');
      if (nameElement) {
        if (nameElement.scrollWidth > 300) {
          this.avatarName.nativeElement.classList.add('scroll');
        } else {
          this.avatarName.nativeElement.classList.remove('scroll');
        }
      }
    }
  }

  /**
   * Lifecycle hook that is called after the component's view has been checked.
   * This method calls `checkNameWidth` to ensure that the width of the name element
   * is checked and the appropriate class is added or removed based on its width.
   *
   * @returns {void}
   */
  ngAfterViewChecked(): void {
    this.checkNameWidth();
  }

  /**
  * Extracts the first and last word of a given name.
  * @param {string} name - The full name of the user.
  * @returns {string} - The processed name containing only the first and last word.
  */
  getFirstAndLastName(name: string): string {
    const words = name.split(' ');
    if (words.length > 1) {
      return `${words[0]} ${words[words.length - 1]}`;
    }
    return name;
  }

  scrollToBottomWithDelay(): void {
    if (this.channelMessageContent) {
      this.scrollToBottom(this.channelMessageContent);
    }
    if (this.directMessageContent) {
      this.scrollToBottom(this.directMessageContent);
    }
  }

  scrollToBottom(elementRef: ElementRef): void {
    if (elementRef) {
      try {
        setTimeout(() => {
          elementRef.nativeElement.scrollTop =
            elementRef.nativeElement.scrollHeight;
        }, 100); // Delay to ensure DOM is fully updated
      } catch (err) {
        console.error('Scroll to bottom error:', err);
      }
    }
  }

  isUser(result: Channel | User): result is User {
    return (result as User).avatar !== undefined;
  }

  openChannel(id: string) {
    this.channelsService.getDataChannel(id);
    this.form.get('recipient')?.setValue('');
  }

  openDirectMessage(id: string, currentUser: User) {
    this.directMessagesService.getDataDirectMessage(id, currentUser);
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
   * @returns An observable of the search results (channels oder users).
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
        this.openChannelInfoMobileDialog(channelId);
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
   * This function opens the channel info mobile dialog
   *
   * @param channelId string
   */
  openChannelInfoMobileDialog(channelId: string): void {
    if (this.currentUser) {
      const dialogRef = this.dialog.open(ChannelInfoMobileComponent, {
        width: '100%',
        height: '100vh',
        data: { channelId: channelId },
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
    const dialogWidth = 415;
    const screenWidth = window.innerWidth;
    let leftPosition;

    if (screenWidth <= 500) {
      leftPosition = (screenWidth - dialogWidth) / 2 + window.scrollX;
    } else {
      leftPosition = rect.left + window.scrollX - 400;
    }

    this.dialog.open(MembersComponent, {
      width: `${dialogWidth}px`,
      position: {
        top: `${rect.bottom + window.scrollY + 10}px`,
        left: `${leftPosition}px`,
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
    if (window.innerWidth <= 750) {
      this.openAddUserToChannelMobileDialog(channelId);
    } else {
      this.dialog.open(AddUserToChannelComponent, {
        width: '800px',
        height: '800px',
        position: {
          top: `${rect.bottom + window.scrollY + 10}px`,
          left: `${rect.left + window.scrollX - 475}px`,
        },
        data: { channelId: channelId },
      });
    }
  }

  /**
   * This function opens the dialog to add a user to a channel.
   *
   * @param channelId string
   */
  openAddUserToChannelMobileDialog(channelId: string): void {
    if (this.currentUser) {
      const dialogRef = this.dialog.open(AddUserToChannelMobileComponent, {
        width: '514px',
        height: '514px',
        data: { channelId: channelId },
      });
      this.isDialogOpen = true;

      dialogRef.afterClosed().subscribe(() => {
        this.isDialogOpen = false;
      });
    }
  }

  /**
   * This function opens the dialog for the detail view of a user in a direct message.
   *
   * @param user object of type minimal user
   */
  openDetailViewDialog(user: MinimalUser): void {
    debugger;
    this.dialog.open(ProfileDetailViewComponent, {
      width: '500px',
      data: {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userAvatar: user.avatar,
      },
    });
  }

  /**
   * This function turns a UTX timestamp into "heute" if it is today or the day of the week plus date.
   *
   * @param timestamp number, UTX
   * @returns string, "heute" or weekday plus date
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
   * This function is needed for the date line. It checks if the date of the new post is the same as the the date of the previous one.
   *
   * @param index number, index of the post
   * @param path string, channel oder directMessage
   * @returns boolean
   */
  isNewDate(index: number, path: string): boolean {
    if (index === 0) {
      return true;
    }
    switch (path) {
      case 'channel':
        return this.isDifferentDate(
          this.selectedChannel.posts[index].timestamp,
          this.selectedChannel.posts[index - 1].timestamp
        );
      case 'directMessage':
        return this.isDifferentDate(
          this.selectedDirectMessage.posts[index].timestamp,
          this.selectedDirectMessage.posts[index - 1].timestamp
        );
      default:
        return false;
    }
  }

  /**
   * This function compares the current and the previous timestamp. It formats them an returns false if they are not the same.
   *
   * @param currentTimestamp number, UTX
   * @param previousTimestamp number, UTX
   * @returns boolean
   */
  isDifferentDate(
    currentTimestamp: number,
    previousTimestamp: number
  ): boolean {
    const currentPostDate = this.formatDate(currentTimestamp);
    const previousPostDate = this.formatDate(previousTimestamp);
    return currentPostDate !== previousPostDate;
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
    this.threadsService.getDataThread(this.selectedChannel.name, post);
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

  /**
   * This function sets the focus on the input field of the main content component if a thread is closed.
   */
  callSetFocus() {
    this.postInputComponent.setFocus();
  }
}
