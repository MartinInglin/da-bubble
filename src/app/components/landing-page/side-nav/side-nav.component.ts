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
  userChannelIds = this.currentUser.channels.map(channel => channel.id);
  userDirectMessageIds = [this.currentUser.privateDirectMessageId];

  arrowOpen: any = 'assets/images/icons/arrow_drop_down.svg';
  arrowClosed: any = 'assets/images/icons/arrow_drop_right.svg';

    /**
   * Constructor to initialize the component with necessary services and form builder.
   * @param dialog - MatDialog service for opening dialogs
   * @param fb - FormBuilder service for creating form groups
   */
  constructor(private dialog: MatDialog, private fb: FormBuilder,) {
    this.form = this.fb.group({
      recipient: [''],
    });
  }

    /**
   * Lifecycle hook called after component initialization.
   * Subscribes to state changes for contacts, channels, and all users.
   * Fetches direct messages and posts relevant to the current user.
   * Subscribes to changes in the side navigation state.
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
   * Initializes filtered channels based on the current user's channels.
   * Filters channels based on the search term.
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
   * Subscribes to changes in showing contacts state from the state service.
   */
  subscribeToShowContacts(): void {
    this.stateService.showContacts$.subscribe((show) => {
      this.showContacts = show;
    });
  }

   /**
   * Subscribes to changes in showing channels state from the state service.
   */
  subscribeToShowChannels(): void {
    this.stateService.showChannels$.subscribe((show) => {
      this.showChannels = show;
    });
  }

   /**
   * Subscribes to changes in the list of all users from the users service.
   * Filters users based on the search term.
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
   * Fetches direct messages and posts relevant to the current user.
   * Retrieves direct messages and filters posts based on channel and direct message IDs.
   */
  fetchDirectMessagesAndPosts(): void {
    this.directMessagesService.getDirectMessagesCollection().then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        const directMessage = doc.data() as DirectMessage;
        if (directMessage.users.some(user => user.id === this.currentUser.id)) {
          this.userDirectMessageIds.push(doc.id);
        }
      });
      this.postsService.getAllPostsForUser(this.userChannelIds, this.userDirectMessageIds)
        .subscribe((posts) => {
          this.filteredPosts = posts;
          this.filteredPosts.forEach(post => {
            const channel = this.filteredChannels.find(c => c.id === post.channelId);
            if (channel) {
              post.channelName = channel.name;
            }const user = this.allUsers.find(u => u.id === post.userId);
            if (user) {
              post.userName = user.name;
            }
          });
        });
    });
  }

   /**
   * Subscribes to changes in the side navigation open state from the state service.
   * Closes thread if side navigation is open.
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
   * Event listener for handling clicks outside the search results list.
   * Closes search results if click is outside the list.
   * @param event - MouseEvent object representing the click event
   */
  @HostListener('document:click', ['$event'])
  handleClickOutside(event: MouseEvent): void {
    if (this.searchResultsList && !this.searchResultsList.nativeElement.contains(event.target)) {
      this.closeSearchResults();
    }
  }

    /**
   * Initiates search based on the recipient input.
   * Searches channels, users, or all based on the input prefix (#, @).
   */
    onSearch(): void {
      const term = this.form.get('recipient')?.value;
      this.searchTerm = typeof term === 'string' ? term : '';
  
      if (this.searchTerm.length >= 3 && (this.searchTerm.startsWith('#') || this.searchTerm.startsWith('@'))) {
        this.search(this.searchTerm).subscribe((results) => {
          this.searchResults = results.length ? results : [];
          // this.noResults = results.length === 0;
        });
      } else {
        // this.noResults = false;
        this.searchResults = [];
      }
    }

    onInput(): void {
      const term = this.form.get('recipient')?.value;
      this.searchTerm = typeof term === 'string' ? term : '';
  
      if (this.searchTerm.length >= 3 && (this.searchTerm.startsWith('#') || this.searchTerm.startsWith('@'))) {
        this.onSearch();
      } else {
        // this.noResults = false;
        this.searchResults = [];
      }
    }

    onBlur(): void {
      // this.noResults = false;
      this.searchResults = [];
      this.form.get('recipient')?.setValue('');
    }


  /**
   * Displays a message when no search results are found.
   */
  private showNoResultsMessage(): void {
    this.showNoResults = true;
    setTimeout(() => {
      this.showNoResults = false;
    }, 5000);
  }

   /**
   * Retrieves data for a specific channel.
   * @param channelId - ID of the channel to retrieve data for
   */
  getDataChannel(channelId: string) {
    this.channelsService.getDataChannel(channelId);
  }

   /**
   * Closes search results and clears recipient input.
   */
  closeSearchResults(): void {
    this.searchResults = [];
    this.form.get('recipient')?.setValue('');
  }

    /**
   * Returns the recipient form control.
   * @returns {FormControl} The recipient form control
   */
  get recipient(): FormControl {
    return this.form.get('recipient') as FormControl;
  }

   /**
   * Checks if the provided search result is a User object.
   * @param result - The search result to check
   * @returns {boolean} True if the result is a User, false otherwise
   */
  isUser(result: Channel | User | Post): result is User {
    return (result as User).avatar !== undefined;
  }

    /**
   * Checks if the provided search result is a Post object.
   * @param result - The search result to check
   * @returns {boolean} True if the result is a Post, false otherwise
   */
  isPost(result: Channel | User | Post): result is Post {
    return (result as Post).message !== undefined;
  }

  /**
   * Closes the side navigation.
   */
  closeSideNav() {
    this.isOpen = false;
  }

    /**
   * Checks if the screen width is below a specified width.
   * @param width - The width threshold to check against
   * @returns {boolean} True if the screen width is below the specified width, false otherwise
   */
  isScreenWidthBelow(width: number): boolean {
    return window.innerWidth < width;
  }

   /**
   * Closes the side navigation drawer on mobile devices.
   */
  closeSidenavMobile() {
    if (this.isScreenWidthBelow(1360)) {
      this.toggleDrawer.emit();
      this.stateService.closeThread();
    }
  }

  /**
   * Closes the side navigation drawer on mobile devices after selecting contacts.
   */
  closeSidenavMobileAfterContacts() {
    if (this.isScreenWidthBelow(1360)) {
      this.toggleDrawer.emit();
      this.stateService.closeThread();
    }
  }

    /**
   * Initiates search based on the provided search term prefix (# for channels, @ for users).
   * @param searchTerm - The search term entered by the user
   * @returns {Observable<(Channel | User | Post)[]>} Observable emitting search results
   */
    search(searchTerm: string): Observable<(Channel | User)[]> {
      if (searchTerm.startsWith('#')) {
        const filteredChannels = this.filteredChannels.filter(
          (channel) =>
            channel.name
              .toLowerCase()
              .includes(searchTerm.slice(1).toLowerCase()) &&
            !channel.isDirectMessage
        );
        return of(filteredChannels);
      } else if (searchTerm.startsWith('@')) {
        const filteredUsers = this.allUsers.filter(
          (user) =>
            user.name.toLowerCase().includes(searchTerm.slice(1).toLowerCase()) &&
            !user.isChannel
        );
        return of(this.filterCurrentUser(filteredUsers));
      } else {
        return of([]);
      }
    }

    /**
 * Searches filtered channels based on a search term.
 * Returns an observable of channels that match the search term.
 * 
 * @param {string} term - The search term to filter channels by name.
 * @returns {Observable<Channel[]>} An observable of channels matching the search term.
 */
  private searchChannels(term: string): Observable<Channel[]> {
    return of(this.filteredChannels.filter(channel =>
      channel.name.toLowerCase().includes(term.toLowerCase())));
  }

  /**
 * Searches all users based on a search term.
 * Returns an observable of users that match the search term.
 * 
 * @param {string} term - The search term to filter users by name.
 * @returns {Observable<User[]>} An observable of users matching the search term.
 */
  private searchUsers(term: string): Observable<User[]> {
    return of(this.allUsers.filter(user =>
      user.name.toLowerCase().includes(term.toLowerCase())));
  }

  /**
 * Searches all users based on a search term.
 * Returns an observable of users that match the search term.
 * 
 * @param {string} term - The search term to filter users by name.
 * @returns {Observable<User[]>} An observable of users matching the search term.
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
 * Filters out the current user from a list of users.
 * 
 * @param {User[]} users - The array of users to filter.
 * @returns {User[]} An array of users excluding the current user.
 */
  filterCurrentUser(users: User[]): User[] {
    return users.filter(user => user.id !== this.currentUser.id);
  }

  /**
 * Opens a channel by retrieving data using the given channel ID.
 * Updates recipient form value and closes the drawer if it's open.
 * 
 * @param {string} id - The ID of the channel to open.
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
 * Opens a post by retrieving post data using the given post ID.
 * Scrolls to the post element after fetching data and updates recipient form value.
 * 
 * @param {string} id - The ID of the post to open.
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
 * Scrolls to the post with the specified post ID.
 * 
 * @param {string} postId - The ID of the post to scroll to.
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
 * Highlights a post element by adding a CSS class for a brief period.
 * 
 * @param {HTMLElement} element - The post element to highlight.
 */
  highlightPost(element: HTMLElement): void {
    element.classList.add('highlight');
    setTimeout(() => {
      element.classList.remove('highlight');
    }, 5000);
  }

  /**
 * Opens a direct message by retrieving data using the given message ID and user data.
 * Updates recipient form value and closes the drawer if it's open.
 * 
 * @param {string} id - The ID of the direct message to open.
 * @param {any} data - Additional data associated with the direct message.
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
 * Closes both channels and contacts by updating their respective show states to false.
 */
  closeChannelsAndContacts() {
    this.stateService.setShowContacts(false);
    this.stateService.setShowChannels(false);
  }

  /**
 * Asynchronously fetches all users using the UsersService.
 */
  async getAllUsers() {
    this.usersService.getAllUsers();
  }

  /**
 * Extracts the first and last name from a full name string.
 * 
 * @param {string} name - The full name to extract from.
 * @returns {string} The first and last name extracted from the full name.
 */
  getFirstAndLastName(name: string): string {
    const words = name.split(' ');
    if (words.length > 1) {
      return `${words[0]} ${words[words.length - 1]}`;
    }
    return name;
  }

  /**
 * Opens a dialog for creating a new channel.
 * Uses different dialog components based on the current window width.
 * 
 * If the window width is less than or equal to 750px, opens a mobile dialog.
 * Otherwise, opens a desktop dialog.
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
 * Uses a full-screen dialog suitable for mobile devices.
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
 * Lifecycle hook that unsubscribes from all active subscriptions when the component is destroyed.
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
