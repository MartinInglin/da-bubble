import { Component, inject, OnInit, OnDestroy, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { User } from '../../../models/user.class';
import { Observable, Subscription, debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { UsersService } from '../../../services/firestore/users.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { UserMenuComponent } from '../../dialogues/user-menu/user-menu.component';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { DirectMessagesService } from '../../../services/firestore/direct-messages.service';
import { Channel } from '../../../models/channel.class';
import { ChannelsService } from '../../../services/firestore/channels.service';
import { UserMenuMobileComponent } from '../../dialogues/mobile/user-menu-mobile/user-menu-mobile.component';
import { Post } from '../../../models/post.class';
import { PostsService } from '../../../services/firestore/posts.service';
import { DirectMessage } from '../../../models/direct-message.class';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    RouterModule,
    MatDialogModule,
    UserMenuComponent,
    UserMenuMobileComponent,
    MatCardModule,
    MatButtonModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  @ViewChild('searchResultsList') searchResultsList!: ElementRef;
  @ViewChild('userDiv') userDiv!: ElementRef;

  authService = inject(AuthService);
  usersService = inject(UsersService);
  channelsService = inject(ChannelsService);
  directMessagesService = inject(DirectMessagesService);

  private userSubscription: Subscription = new Subscription();
  private routeSubscription: Subscription = new Subscription();

  filteredUsers: User[] = [];
  filteredChannels: Channel[] = [];
  filteredPosts: Post[] = [];
  isDialogOpen = false;
  showRegisterElement = true;
  menuDown = 'assets/images/icons/keyboard_arrow_down.svg';
  form: FormGroup;
  searchTerm: string = '';
  searchResults$: Observable<(Channel | User | Post)[]> = of([]);
  searchResults: (Channel | User | Post)[] | undefined;
  allUsers: User[] = [];
  currentUser: User = new User();


  constructor(private dialog: MatDialog,
    private router: Router,
    private fb: FormBuilder,
    private postsService: PostsService) {
    this.form = this.fb.group({
      recipient: [''],
    });
  }

  /**
  * Initializes the component by setting up subscriptions and form controls.
  * 
  * @returns {void}
  */
  ngOnInit(): void {
    // Subscribe to currentUser and filter channels based on search term
    this.userSubscription = this.usersService.currentUser$.subscribe((user) => {
      this.currentUser = user ?? new User();
      const channels: Channel[] = this.currentUser.channels.map(
        (minimalChannel) => new Channel(minimalChannel)
      );
      this.filteredChannels = channels.filter((c) =>
        c.name.toLowerCase().includes(this.searchTerm.toLowerCase())
      );

      // Fetch posts for the channels and direct messages the user is part of
      const userChannelIds = this.currentUser.channels.map(channel => channel.id);
      const userDirectMessageIds = [this.currentUser.privateDirectMessageId];

      // Fetch all direct messages the user is part of
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
    });

    // Subscribe to router events to show or hide register element based on the URL
    this.routeSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.showRegisterElement = event.url === '/' || event.url === '/login';
      }
    });

    // Subscribe to allUsers and filter users based on search term
    this.userSubscription = this.usersService.allUsersSubject$.subscribe(
      (users) => {
        if (users) {
          this.allUsers = users ?? [];
          this.filteredUsers = this.allUsers.filter((u) =>
            u.name.toLowerCase().includes(this.searchTerm.toLowerCase())
          );
        }
      }
    );

    // Listen for form value changes and update search results
    this.searchResults$ = this.form.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((formValue) => {
        const term = formValue.recipient;
        this.searchTerm = typeof term === 'string' ? term : '';
        return this.searchTerm ? this.search(this.searchTerm) : of([]);
      })
    );

    // Subscribe to search results and update the component's state
    this.searchResults$.subscribe((results) => {
      this.searchResults = results;
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
  * Opens a channel based on the provided ID and resets the recipient form control.
  * 
  * @param {string} id - The ID of the channel to open.
  * @returns {void}
  */
  openChannel(id: string): void {
    this.channelsService.getDataChannel(id);
    this.form.get('recipient')?.setValue('');
  }

  /**
  * Opens a direct message based on the provided ID and data, and resets the recipient form control.
  * 
  * @param {string} id - The ID of the direct message to open.
  * @param {any} data - Additional data for the direct message.
  * @returns {void}
  */
  openDirectMessage(id: string, data: any): void {
    this.directMessagesService.getDataDirectMessage(id, data);
    this.form.get('recipient')?.setValue('');
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
     * Selects a recipient (channel, user, or post) and updates the form control value.
     * 
     * @param {Channel | User | Post} recipient - The selected recipient.
     * @returns {void}
     */
  selectRecipient(recipient: Channel | User | Post) {
    const recipientString: any =
      recipient instanceof Channel ? `#${recipient.name}` : `@${recipient.id}`;
    this.form.setValue({ recipient: recipientString });
  }

  /**
   * Searches for channels, users, or posts based on the provided search term.
   * 
   * @param {string} searchTerm - The search term to use.
   * @returns {Observable<(Channel | User | Post)[]>} An observable of the search results.
   */
  search(searchTerm: string): Observable<(Channel | User | Post)[]> {
    // Separate Suchanfragen basierend auf dem Präfix im Suchbegriff
    if (searchTerm.startsWith('#')) {
      return this.searchChannels(searchTerm.slice(1));
    } else if (searchTerm.startsWith('@')) {
      return this.searchUsers(searchTerm.slice(1));
    } else {
      return this.searchAll(searchTerm);
    }
  }

  private searchChannels(term: string): Observable<Channel[]> {
    return of(this.filteredChannels.filter(channel =>
      channel.name.toLowerCase().includes(term.toLowerCase())));
  }

  private searchUsers(term: string): Observable<User[]> {
    return of(this.allUsers.filter(user =>
      user.name.toLowerCase().includes(term.toLowerCase())));
  }

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
   * Unsubscribes from all subscriptions to prevent memory leaks.
   * 
   * @returns {void}
   */
  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }

  /**
   * Opens the user menu dialog based on the screen width.
   * 
   * @returns {void}
   */
  openDialog(): void {
    if (this.currentUser) {
      if (window.innerWidth <= 750) {
        this.openMobileDialog();
      } else {
        const dialogRef = this.dialog.open(UserMenuComponent, {
          width: '282px',
          position: {
            top: '120px',
            right: '30px'
          },
          panelClass: 'mat-dialog-content',
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
   * Opens the mobile user menu dialog.
   * 
   * @returns {void}
   */
  openMobileDialog(): void {
    if (this.currentUser) {
      const dialogRef = this.dialog.open(UserMenuMobileComponent, {
        width: '100%',
        position: {
          bottom: '0',
          right: '50%',
        },
        panelClass: 'mat-dialog-content',
      });
      dialogRef.componentInstance.currentUser = new User(this.currentUser);

      this.isDialogOpen = true;

      dialogRef.afterClosed().subscribe(() => {
        this.isDialogOpen = false;
      });
    }
  }

  /**
   * Changes the menu icon when the mouse hovers over it.
   * 
   * @returns {void}
   */
  onMouseOver(): void {
    this.menuDown = 'assets/images/icons/keyboard_arrow_down_blue.svg';
  }

  /**
   * Resets the menu icon when the mouse leaves it.
   * 
   * @returns {void}
   */
  onMouseOut(): void {
    this.menuDown = 'assets/images/icons/keyboard_arrow_down.svg';
  }

  /**
   * Lifecycle hook called after Angular has fully initialized the component's view.
   * 
   * @returns {void}
   */
  ngAfterViewInit(): void {
    this.checkNameWidth(); // Check the width of the name after view initialization
  }

  /**
   * Lifecycle hook called after Angular has checked the component's view.
   * 
   * @returns {void}
   */
  ngAfterViewChecked(): void {
    this.checkNameWidth(); // Check the width of the name after each view check
  }

  /**
   * Checks the width of the name element within the user container.
   * If the width of the name element is greater than 340 pixels,
   * it adds the 'scroll' class to the user container to trigger a scroll animation.
   * If the width is 340 pixels or less, it removes the 'scroll' class.
   *
   * @returns {void}
   */
  checkNameWidth(): void {
    if (this.userDiv && this.userDiv.nativeElement) {
      const nameElement = this.userDiv.nativeElement.querySelector('.name');
      if (nameElement) {
        if (nameElement.scrollWidth > 400) {
          this.userDiv.nativeElement.classList.add('scroll');
        } else {
          this.userDiv.nativeElement.classList.remove('scroll');
        }
      }
    }
  }

}
