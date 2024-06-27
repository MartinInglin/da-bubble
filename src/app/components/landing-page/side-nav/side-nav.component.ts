import { Component, EventEmitter, Input, OnInit, Output, inject, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StateService } from '../../../services/stateservice.service';
import { NewChannelComponent } from '../../dialogues/new-channel/new-channel.component';
import { NewChannelMobileComponent } from '../../dialogues/mobile/new-channel-mobile/new-channel-mobile.component';
import { User } from '../../../models/user.class';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ChannelsService } from '../../../services/firestore/channels.service';
import { DirectMessagesService } from '../../../services/firestore/direct-messages.service';
import { UsersService } from '../../../services/firestore/users.service';
import { Observable, Subscription, debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Channel } from '../../../models/channel.class';
import { PostsService } from '../../../services/firestore/posts.service';
import { Post } from '../../../models/post.class';
import { DirectMessage } from '../../../models/direct-message.class';


@Component({
  selector: 'app-side-nav',
  standalone: true,
  imports: [CommonModule, NewChannelComponent, MatDialogModule, FormsModule, ReactiveFormsModule],
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.scss'],
})
export class SideNavComponent implements OnInit {
  usersService = inject(UsersService);
  stateService = inject(StateService);
  channelsService = inject(ChannelsService);
  directMessagesService = inject(DirectMessagesService);
  postsService = inject(PostsService);

  @Input() currentUser: User = new User();
  @Output() contactClicked = new EventEmitter<void>();
  @Output() toggleDrawer = new EventEmitter<void>();
  @Output() closeThread = new EventEmitter<void>();

  @ViewChild('searchResultsList') searchResultsList!: ElementRef;

  private allUsersSubscription: Subscription = new Subscription();
  private showContactsSubscription: Subscription = new Subscription();
  private showChannelsSubscription: Subscription = new Subscription();
  private sideNavSubscription: Subscription = new Subscription();

  form: FormGroup;
  searchTerm: string = '';
  searchResults$: Observable<(Channel | User | Post)[]> = of([]);
  searchResults: (Channel | User | Post)[] | undefined;
  allUsers: User[] = [];
  filteredUsers: User[] = [];
  filteredChannels: Channel[] = [];
  filteredPosts: Post[] = [];

  showContacts: boolean = false;
  showChannels: boolean = false;
  isDialogOpen: boolean = false;
  isSideNavOpen: boolean = true;
  isOpen: boolean = false;
  showNoResults: boolean = false;

  arrowOpen: any = 'assets/images/icons/arrow_drop_down.svg';
  arrowClosed: any = 'assets/images/icons/arrow_drop_right.svg';

  constructor(private dialog: MatDialog, private fb: FormBuilder,) {
    this.form = this.fb.group({
      recipient: [''],
    });
  }

/**
 * Lifecycle hook that is called after data-bound properties of a directive are initialized.
 * Initializes subscriptions and fetches necessary data.
 * @returns {void}
 */
ngOnInit(): void {
  this.subscribeToShowContacts();
  this.subscribeToShowChannels();
  this.subscribeToAllUsers();
  this.fetchDirectMessagesAndPosts();
  this.subscribeToSideNavState();
  this.initializeFilteredChannels();
}

/**
 * Initializes the filtered channels based on the current user's channels and the search term.
 * @returns {void}
 */
private initializeFilteredChannels(): void {
  const channels: Channel[] = this.currentUser.channels.map(
    (minimalChannel) => new Channel(minimalChannel)
  );
  this.filteredChannels = channels.filter((c) =>
    c.name.toLowerCase().includes(this.searchTerm.toLowerCase())
  );
}

/**
 * Subscribes to the showContacts observable and updates the showContacts property accordingly.
 * @returns {void}
 */
subscribeToShowContacts(): void {
  this.stateService.showContacts$.subscribe((show) => {
    this.showContacts = show;
  });
}

/**
 * Subscribes to the showChannels observable and updates the showChannels property accordingly.
 * @returns {void}
 */
subscribeToShowChannels(): void {
  this.stateService.showChannels$.subscribe((show) => {
    this.showChannels = show;
  });
}

/**
 * Subscribes to the allUsers observable and updates the allUsers and filteredUsers properties.
 * @returns {void}
 */
subscribeToAllUsers(): void {
  this.allUsersSubscription = this.usersService.allUsersSubject$.subscribe(
    (users) => {
      if (users) {
        this.allUsers = users ?? [];
        this.filteredUsers = this.allUsers.filter((u) =>
          u.name.toLowerCase().includes(this.searchTerm.toLowerCase())
        );
      }
    }
  );
}

/**
 * Fetches direct messages and posts for the current user and updates the filteredPosts property.
 * @returns {void}
 */
fetchDirectMessagesAndPosts(): void {
  const userChannelIds = this.currentUser.channels.map(channel => channel.id);
  const userDirectMessageIds = [this.currentUser.privateDirectMessageId];

  this.directMessagesService.getDirectMessagesCollection().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      const directMessage = doc.data() as DirectMessage;
      if (directMessage.users.some(user => user.id === this.currentUser.id)) {
        userDirectMessageIds.push(doc.id);
      }
    });

    this.postsService.getAllPostsForUser(userChannelIds, userDirectMessageIds)
      .subscribe((posts) => {
        this.filteredPosts = posts;

        this.filteredPosts.forEach(post => {
          const channel = this.filteredChannels.find(c => c.id === post.channelId);
          if (channel) {
            post.channelName = channel.name;
          }
          const user = this.allUsers.find(u => u.id === post.userId);
          if (user) {
            post.userName = user.name;
          }
        });
      });
  });
}

/**
 * Subscribes to the sideNavOpen observable and updates the isSideNavOpen property.
 * Closes the thread if the side navigation is opened.
 * @returns {void}
 */
subscribeToSideNavState(): void {
  this.sideNavSubscription = this.stateService.sideNavOpen$.subscribe((isOpen) => {
    this.isSideNavOpen = isOpen;
    if (isOpen) {
      this.stateService.closeThread();
    }
  });
}

/**
 * Handles clicks outside the search results list to close the search results.
 * @param {MouseEvent} event - The mouse event.
 * @returns {void}
 */
@HostListener('document:click', ['$event'])
handleClickOutside(event: MouseEvent): void {
  if (this.searchResultsList && !this.searchResultsList.nativeElement.contains(event.target)) {
    this.closeSearchResults();
  }
}

/**
 * Performs a search based on the current search term and updates the search results.
 * @returns {void}
 */
onSearch(): void {
  const term = this.form.get('recipient')?.value;
  this.searchTerm = typeof term === 'string' ? term : '';
  if (this.searchTerm) {
    this.search(this.searchTerm).subscribe((results) => {
      this.searchResults = results;
      if (results.length === 0) {
        this.showNoResultsMessage();
      }
    });
  }
}

/**
 * Displays a message indicating no search results were found.
 * @returns {void}
 */
private showNoResultsMessage(): void {
  this.showNoResults = true;
  setTimeout(() => {
    this.showNoResults = false;
  }, 5000);
}

/**
 * Retrieves data for a specific channel.
 * @param {string} channelId - The ID of the channel to retrieve data for.
 * @returns {void}
 */
getDataChannel(channelId: string) {
  this.channelsService.getDataChannel(channelId);
}

/**
 * Closes the search results and clears the search input.
 * @returns {void}
 */
closeSearchResults(): void {
  this.searchResults = [];
  this.form.get('recipient')?.setValue('');
}

/**
 * Retrieves the form control for the recipient field.
 * @returns {FormControl} The form control for the recipient field.
 */
get recipient(): FormControl {
  return this.form.get('recipient') as FormControl;
}

/**
 * Checks if a given result is a User.
 * @param {Channel | User | Post} result - The result to check.
 * @returns {boolean} True if the result is a User, otherwise false.
 */
isUser(result: Channel | User | Post): result is User {
  return (result as User).avatar !== undefined;
}

/**
 * Checks if a given result is a Post.
 * @param {Channel | User | Post} result - The result to check.
 * @returns {boolean} True if the result is a Post, otherwise false.
 */
isPost(result: Channel | User | Post): result is Post {
  return (result as Post).message !== undefined;
}

/**
 * Closes the side navigation.
 * @returns {void}
 */
closeSideNav() {
  this.isOpen = false;
}

/**
 * Checks if the current screen width is below a specified width.
 * @param {number} width - The width to check against.
 * @returns {boolean} True if the screen width is below the specified width, otherwise false.
 */
isScreenWidthBelow(width: number): boolean {
  return window.innerWidth < width;
}

/**
 * Closes the side navigation on mobile devices if the screen width is below 1360 pixels.
 * @returns {void}
 */
closeSidenavMobile() {
  if (this.isScreenWidthBelow(1360)) {
    this.toggleDrawer.emit();
    this.stateService.closeThread();
  }
}

/**
 * Closes the side navigation after viewing contacts on mobile devices if the screen width is below 1360 pixels.
 * @returns {void}
 */
closeSidenavMobileAfterContacts() {
  if (this.isScreenWidthBelow(1360)) {
    this.toggleDrawer.emit();
    this.stateService.closeThread();
  }
}

/**
 * Searches for channels, users, or posts based on the given search term.
 * @param {string} searchTerm - The term to search for.
 * @returns {Observable<(Channel | User | Post)[]>} An observable of search results.
 */
search(searchTerm: string): Observable<(Channel | User | Post)[]> {
  if (searchTerm.startsWith('#')) {
    return this.searchChannels(searchTerm.slice(1));
  } else if (searchTerm.startsWith('@')) {
    return this.searchUsers(searchTerm.slice(1));
  } else {
    return this.searchAll(searchTerm);
  }
}

/**
 * Searches for channels based on the given term.
 * @param {string} term - The term to search for.
 * @returns {Observable<Channel[]>} An observable of channels.
 */
private searchChannels(term: string): Observable<Channel[]> {
  return of(this.filteredChannels.filter(channel =>
    channel.name.toLowerCase().includes(term.toLowerCase())));
}

/**
 * Searches for users based on the given term.
 * @param {string} term - The term to search for.
 * @returns {Observable<User[]>} An observable of users.
 */
private searchUsers(term: string): Observable<User[]> {
  return of(this.allUsers.filter(user =>
    user.name.toLowerCase().includes(term.toLowerCase())));
}

/**
 * Searches for channels, users, and posts based on the given term.
 * @param {string} term - The term to search for.
 * @returns {Observable<(Channel | User | Post)[]>} An observable of search results.
 */
private searchAll(term: string): Observable<(Channel | User | Post)[]> {
  const filteredChannels = this.filteredChannels.filter(channel =>
    channel.name.toLowerCase().includes(term.toLowerCase()));
  const filteredUsers = this.allUsers.filter(user =>
    user.name.toLowerCase().includes(term.toLowerCase()));
  const filteredPosts = this.filteredPosts.filter(post =>
    post.message.toLowerCase().includes(term.toLowerCase()));

  return of([...filteredChannels, ...filteredUsers, ...filteredPosts]);
}

/**
 * Filters out the current user from the search results.
 * @param {(Channel | User | Post)[]} results - The search results to filter.
 * @returns {(Channel | User | Post)[]} The filtered search results.
 */
private filterCurrentUser(results: (Channel | User | Post)[]): (Channel | User | Post)[] {
  return results.filter(result => {
    if (this.isUser(result)) {
      return result.id !== this.currentUser.id;
    }
    return true;
  });
}

/**
 * Opens a channel based on the given ID and clears the search input.
 * @param {string} id - The ID of the channel to open.
 * @returns {void}
 */
openChannel(id: string) {
  this.channelsService.getDataChannel(id);
  this.form.get('recipient')?.setValue('');
  if (this.isOpen) {
    this.toggleDrawer.emit();
    this.stateService.closeThread();
  }
}

/**
 * Opens a post based on the given ID and scrolls to it.
 * @param {string} id - The ID of the post to open.
 * @returns {void}
 */
openPost(id: string): void {
  this.closeSidenavMobile();
  this.postsService.getPostById(id).subscribe(result => {
    if (result) {
      const { post, path, channelId } = result;
      if (path === 'channels') {
        this.channelsService.getDataChannel(channelId);
        this.scrollToPost(id);
      } else if (path === 'directMessages') {
        this.usersService.currentUser$.subscribe(currentUser => {
          if (currentUser) {
            this.directMessagesService.getDataDirectMessage(channelId, currentUser);
            this.scrollToPost(id);
          } else {
            console.error('No current user found');
          }
        });
      }
    } else {
      console.log('Post not found');
    }
  });

  this.form.get('recipient')?.setValue('');
}

/**
 * Scrolls to a specific post based on the post ID.
 * @param {string} postId - The ID of the post to scroll to.
 * @returns {void}
 */
scrollToPost(postId: string): void {
  setTimeout(() => {
    const element = document.getElementById(`post-${postId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      this.highlightPost(element);
    }
  }, 500);
}

/**
 * Highlights a specific post element by adding a highlight class.
 * @param {HTMLElement} element - The post element to highlight.
 * @returns {void}
 */
highlightPost(element: HTMLElement): void {
  element.classList.add('highlight');
  setTimeout(() => {
    element.classList.remove('highlight');
  }, 5000);
}

/**
 * Opens a direct message based on the given ID and data.
 * @param {string} id - The ID of the direct message to open.
 * @param {any} data - The data for the direct message.
 * @returns {void}
 */
openDirectMessage(id: string, data: any) {
  this.directMessagesService.getDataDirectMessage(id, data);
  this.form.get('recipient')?.setValue('');
  if (this.isOpen) {
    this.toggleDrawer.emit();
    this.stateService.closeThread();
  }
}

/**
 * Closes the channels and contacts views.
 * @returns {void}
 */
closeChannelsAndContacts() {
  this.stateService.setShowContacts(false);
  this.stateService.setShowChannels(false);
}

/**
 * Fetches all users.
 * @returns {Promise<void>}
 */
async getAllUsers() {
  this.usersService.getAllUsers();
}

/**
 * Extracts and returns the first and last name from a full name string.
 * @param {string} name - The full name string.
 * @returns {string} The first and last name.
 */
getFirstAndLastName(name: string): string {
  const words = name.split(' ');
  if (words.length > 1) {
    return `${words[0]} ${words[words.length - 1]}`;
  }
  return name;
}

/**
 * Opens a dialog for creating a new channel. Opens a mobile dialog if the screen width is below 750 pixels.
 * @returns {void}
 */
openNewChannelDialog(): void {
  if (this.currentUser) {
    if (window.innerWidth <= 750) {
      this.openMobileDialog();
    } else {
      const dialogRef = this.dialog.open(NewChannelComponent, {
        width: '872px',
        height: '539px',
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
 * Opens a mobile dialog for creating a new channel.
 * @returns {void}
 */
openMobileDialog(): void {
  if (this.currentUser) {
    const dialogRef = this.dialog.open(NewChannelMobileComponent, {
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
 * Lifecycle hook that is called when the directive is destroyed. Unsubscribes from all active subscriptions.
 * @returns {void}
 */
ngOnDestroy(): void {
  if (this.allUsersSubscription) {
    this.allUsersSubscription.unsubscribe();
  }
  if (this.showChannelsSubscription) {
    this.showChannelsSubscription.unsubscribe();
  }
  if (this.showContactsSubscription) {
    this.showContactsSubscription.unsubscribe();
  }
  if (this.sideNavSubscription) {
    this.sideNavSubscription.unsubscribe();
  }
}
}
