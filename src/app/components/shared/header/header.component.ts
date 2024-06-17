import { Component, inject, OnInit, OnDestroy, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { User } from '../../../models/user.class';
import { Observable, Subscription, debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { UsersService } from '../../../services/firestore/users.service';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { UserMenuComponent } from '../../dialogues/user-menu/user-menu.component';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { DirectMessagesService } from '../../../services/firestore/direct-messages.service';
import { Channel } from '../../../models/channel.class';
import { ChannelsService } from '../../../services/firestore/channels.service';
import { UserMenuMobileComponent } from '../../dialogues/mobile/user-menu-mobile/user-menu-mobile.component';

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

  authService = inject(AuthService);
  usersService = inject(UsersService);
  channelsService = inject(ChannelsService);

  private userSubscription: Subscription = new Subscription();
  private routeSubscription: Subscription = new Subscription();

  filteredUsers: User[] = [];
  filteredChannels: Channel[] = [];
  isDialogOpen = false;
  showRegisterElement = true;
  menuDown = './../../../../assets/images/icons/keyboard_arrow_down.svg';
  form: FormGroup;
  searchTerm: string = '';
  searchResults$: Observable<(Channel | User)[]> = of([]);
  searchResults: (Channel | User)[] | undefined;
  allUsers: User[] = [];
  currentUser: User = new User();

  constructor(private dialog: MatDialog,
              private router: Router,
              private fb: FormBuilder,
              public directMessagesService: DirectMessagesService) {
    this.directMessagesService = directMessagesService;
    this.form = this.fb.group({
      recipient: [''],
    });
  }

  ngOnInit(): void {
    // Subscribe to currentUser$ observable to update currentUser
    this.userSubscription = this.usersService.currentUser$.subscribe((user) => {
      this.currentUser = user ?? new User();

      // Map minimalChannel data to Channel objects and filter by searchTerm
      const channels: Channel[] = this.currentUser.channels.map(
        (minimalChannel) => new Channel(minimalChannel)
      );
      this.filteredChannels = channels.filter((c) =>
        c.name.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    });

    // Subscribe to router events to toggle register element visibility
    this.routeSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.showRegisterElement = event.url === '/' || event.url === '/login';
      }
    });

    // Subscribe to allUsersSubject$ observable to update allUsers
    this.userSubscription = this.usersService.allUsersSubject$.subscribe(
      (users) => {
        if (users) {
          this.allUsers = users ?? [];

          // Filter allUsers by searchTerm
          this.filteredUsers = this.allUsers.filter((u) =>
            u.name.toLowerCase().includes(this.searchTerm.toLowerCase())
          );
        }
      }
    );

    // Observe form value changes for search and update searchResults$
    this.searchResults$ = this.form.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((formValue) => {
        const term = formValue.recipient;
        this.searchTerm = typeof term === 'string' ? term : '';
        return this.searchTerm ? this.search(this.searchTerm) : of([]);
      })
    );

    // Subscribe to searchResults$ and update searchResults
    this.searchResults$.subscribe((results) => {
      this.searchResults = results;
    });
  }

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: MouseEvent): void {
    if (this.searchResultsList && !this.searchResultsList.nativeElement.contains(event.target)) {
      this.closeSearchResults();
    }
  }

  closeSearchResults(): void {
    this.searchResults = [];
    this.form.get('recipient')?.setValue(''); // Clear the input field
  }

  // Get recipient form control
  get recipient(): FormControl {
    return this.form.get('recipient') as FormControl;
  }

  // Type guard to check if result is a User
  isUser(result: Channel | User): result is User {
    return (result as User).avatar !== undefined;
  }

  // Open channel based on recipient ID
  openChannel(id: string): void {
    this.channelsService.getDataChannel(id);
    this.form.get('recipient')?.setValue('');
  }

  // Open direct message based on recipient ID and other parameters
  openDirectMessage(id: string, data: any): void {
    this.directMessagesService.getDataDirectMessage(id, data);
    this.form.get('recipient')?.setValue('');
  }

  // Select recipient and set form value accordingly
  selectRecipient(recipient: Channel | User) {
    const recipientString: any =
      recipient instanceof Channel ? `#${recipient.name}` : `@${recipient.id}`;
    this.form.setValue({ recipient: recipientString });
  }

  // Perform search based on searchTerm and return Observable of results
  search(searchTerm: string): Observable<(Channel | User)[]> {
    // Search for channels if searchTerm starts with '#'
    if (searchTerm.startsWith('#')) {
      const filteredChannels = this.filteredChannels.filter((channel) =>
        channel.name.toLowerCase().includes(searchTerm.slice(1).toLowerCase()) && !channel.isDirectMessage
      );
      return of(filteredChannels);
    }
    // Search for users if searchTerm starts with '@'
    else if (searchTerm.startsWith('@')) {
      const filteredUsers = this.allUsers.filter((user) =>
        user.name.toLowerCase().includes(searchTerm.slice(1).toLowerCase()) && !user.isChannel
      );
      return of(this.filterCurrentUser(filteredUsers));
    }
    // General search (no prefix)
    else {
      const filteredChannels = this.filteredChannels.filter((channel) =>
        channel.name.toLowerCase().includes(searchTerm.toLowerCase()) && !channel.isDirectMessage
      );
      const filteredUsers = this.allUsers.filter((user) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) && !user.isChannel
      );

      // Merge search results
      const results = [...filteredChannels, ...filteredUsers];
      return of(this.filterCurrentUser(results));
    }
  }

  // Filter out currentUser from search results
  private filterCurrentUser(results: (Channel | User)[]): (Channel | User)[] {
    return results.filter(result => {
      if (this.isUser(result)) {
        return result.id !== this.currentUser.id;
      }
      return true;
    });
  }

  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }

  // Open user menu dialog based on window width
  openDialog(): void {
    if (this.currentUser) {
      if (window.innerWidth <= 750) {
        this.openMobileDialog();
      } else {
        // Open desktop user menu dialog
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

        // Close dialog handler
        dialogRef.afterClosed().subscribe(() => {
          this.isDialogOpen = false;
        });
      }
    }
  }

  // Open mobile user menu dialog
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

      // Close dialog handler
      dialogRef.afterClosed().subscribe(() => {
        this.isDialogOpen = false;
      });
    }
  }

  // Handle mouse over event for menu arrow icon
  onMouseOver(): void {
    this.menuDown = './../../../../assets/images/icons/keyboard_arrow_down_blue.svg';
  }

  // Handle mouse out event for menu arrow icon
  onMouseOut(): void {
    this.menuDown = './../../../../assets/images/icons/keyboard_arrow_down.svg';
  }
}
