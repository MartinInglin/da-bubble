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

  arrowOpen: any = 'assets/images/icons/arrow_drop_down.svg';
  arrowClosed: any = 'assets/images/icons/arrow_drop_right.svg';

  constructor(private dialog: MatDialog, private fb: FormBuilder,) {
    this.form = this.fb.group({
      recipient: [''],
    });
  }
  
  /**
   * Initializes the component, subscribes to relevant data sources, and sets up the search logic.
   * 
   * @returns {void}
   */
  ngOnInit(): void {
    // Subscribe to show contacts
    this.stateService.showContacts$.subscribe((show) => {
      this.showContacts = show;
    });

    // Subscribe to show channels
    this.stateService.showChannels$.subscribe((show) => {
      this.showChannels = show;
    });

    // Subscribe to the list of all users and filter based on the search term
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

    // Get user channel IDs and direct message IDs
    const userChannelIds = this.currentUser.channels.map(channel => channel.id);
    const userDirectMessageIds = [this.currentUser.privateDirectMessageId];

    // Fetch all direct messages the user is part of and their posts
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

    // Subscribe to form value changes and update search results
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

    // Subscribe to side navigation open state
    this.sideNavSubscription = this.stateService.sideNavOpen$.subscribe((isOpen) => {
      this.isSideNavOpen = isOpen;
      if (isOpen) {
        this.stateService.closeThread();
      }
    });
  }

  /**
   * Handles click events outside the search results list to close the results.
   * 
   * @param {MouseEvent} event - The mouse event object.
   * @returns {void}
   */
  @HostListener('document:click', ['$event'])
  handleClickOutside(event: MouseEvent): void {
    if (this.searchResultsList && !this.searchResultsList.nativeElement.contains(event.target)) {
      this.closeSearchResults();
    }
  }

  /**
   * Retrieves data for the specified channel.
   * 
   * @param {string} channelId - The ID of the channel to retrieve data for.
   * @returns {void}
   */
  getDataChannel(channelId: string) {
    this.channelsService.getDataChannel(channelId);
  }

  /**
   * Closes the search results by clearing the search results array and resetting the form control.
   * 
   * @returns {void}
   */
  closeSearchResults(): void {
    this.searchResults = [];
    this.form.get('recipient')?.setValue('');
  }

  /**
   * Gets the form control for the recipient input field.
   * 
   * @returns {FormControl} The form control for the recipient input field.
   */
  get recipient(): FormControl {
    return this.form.get('recipient') as FormControl;
  }

  /**
   * Determines if the result is a User object.
   * 
   * @param {Channel | User | Post} result - The search result to check.
   * @returns {boolean} True if the result is a User, false otherwise.
   */
  isUser(result: Channel | User | Post): result is User {
    return (result as User).avatar !== undefined;
  }

  /**
   * Determines if the result is a Post object.
   * 
   * @param {Channel | User | Post} result - The search result to check.
   * @returns {boolean} True if the result is a Post, false otherwise.
   */
  isPost(result: Channel | User | Post): result is Post {
    return (result as Post).message !== undefined;
  }

  /**
   * Closes the side navigation.
   * 
   * @returns {void}
   */
  closeSideNav() {
    this.isOpen = false;
  }

  /**
   * Closes the side navigation on mobile devices.
   * 
   * @returns {void}
   */
  closeSidenavMobile() {
    this.toggleDrawer.emit();
    this.stateService.closeThread();
  }

  /**
   * Closes the side navigation on mobile devices after selecting contacts.
   * 
   * @returns {void}
   */
  closeSidenavMobileAfterContacts() {
    this.toggleDrawer.emit();
    this.stateService.closeThread();
  }

  /**
   * Searches for channels, users, or posts based on the provided search term.
   * 
   * @param {string} searchTerm - The search term to use.
   * @returns {Observable<(Channel | User | Post)[]>} An observable of the search results.
   */
  search(searchTerm: string): Observable<(Channel | User | Post)[]> {
    if (searchTerm.startsWith('#')) {
      const filteredChannels = this.filteredChannels.filter((channel) =>
        channel.name.toLowerCase().includes(searchTerm.slice(1).toLowerCase())
      );
      return of(filteredChannels);
    } else if (searchTerm.startsWith('@')) {
      const filteredUsers = this.allUsers.filter((user) =>
        user.name.toLowerCase().includes(searchTerm.slice(1).toLowerCase())
      );
      return of(this.filterCurrentUser(filteredUsers));
    } else {
      const filteredChannels = this.filteredChannels.filter((channel) =>
        channel.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      const filteredUsers = this.allUsers.filter((user) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      const filteredPosts = this.filteredPosts.filter((post) =>
        post.message.toLowerCase().includes(searchTerm.toLowerCase())
      );

      const results = [...filteredChannels, ...filteredUsers, ...filteredPosts];
      return of(this.filterCurrentUser(results));
    }
  }

  /**
   * Filters out the current user from the search results.
   * 
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
   * Opens a channel based on the provided ID and resets the recipient form control.
   * 
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
   * Opens a post based on the provided ID and resets the recipient form control.
   * 
   * @param {string} id - The ID of the post to open.
   * @returns {void}
   */
  openPost(id: string): void {
    console.log('Opening post with ID:', id);
    this.form.get('recipient')?.setValue('');
  }

  /**
   * Opens a direct message based on the provided ID and resets the recipient form control.
   * 
   * @param {string} id - The ID of the direct message to open.
   * @param {any} data - Additional data for the direct message.
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
   * Closes the view of channels and contacts.
   * 
   * @returns {void}
   */
  closeChannelsAndContacts() {
    this.stateService.setShowContacts(false);
    this.stateService.setShowChannels(false);
  }

  /**
   * Retrieves all users.
   * 
   * @returns {Promise<void>} A promise that resolves when all users have been retrieved.
   */
  async getAllUsers() {
    this.usersService.getAllUsers();
  }

  /**
   * Extracts the first and last word of a given name.
   * 
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

  /**
   * Opens the dialog for creating a new channel.
   * 
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
   * Opens the mobile dialog for creating a new channel.
   * 
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
   * Cleans up subscriptions to avoid memory leaks.
   * 
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