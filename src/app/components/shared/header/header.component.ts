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
  directMessagesService = inject(DirectMessagesService);

  private userSubscription: Subscription = new Subscription();
  private routeSubscription: Subscription = new Subscription();

  filteredUsers: User[] = [];
  filteredChannels: Channel[] = [];
  filteredPosts: Post[] = [];
  isDialogOpen = false;
  showRegisterElement = true;
  menuDown = './../../../../assets/images/icons/keyboard_arrow_down.svg';
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

  ngOnInit(): void {
    this.userSubscription = this.usersService.currentUser$.subscribe((user) => {
      this.currentUser = user ?? new User();
      const channels: Channel[] = this.currentUser.channels.map(
        (minimalChannel) => new Channel(minimalChannel)
      );
      this.filteredChannels = channels.filter((c) =>
        c.name.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    });

    this.routeSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.showRegisterElement = event.url === '/' || event.url === '/login';
      }
    });

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

    this.postsService.getPosts('channels', 'documentId').subscribe((posts) => {
      this.filteredPosts = posts;
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

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: MouseEvent): void {
    if (this.searchResultsList && !this.searchResultsList.nativeElement.contains(event.target)) {
      this.closeSearchResults();
    }
  }

  closeSearchResults(): void {
    this.searchResults = [];
    this.form.get('recipient')?.setValue('');
  }

  get recipient(): FormControl {
    return this.form.get('recipient') as FormControl;
  }

  isUser(result: Channel | User | Post): result is User {
    return (result as User).avatar !== undefined;
  }

  isChannel(result: Channel | User | Post): result is Channel {
    return (result as Channel).name !== undefined;
  }

  isPost(result: Channel | User | Post): result is Post {
    return (result as Post).message !== undefined;
  }

  openChannel(id: string): void {
    this.channelsService.getDataChannel(id);
    this.form.get('recipient')?.setValue('');
  }

  openDirectMessage(id: string, data: any): void {
    this.directMessagesService.getDataDirectMessage(id, data);
    this.form.get('recipient')?.setValue('');
  }

  openPost(id: string): void {
    console.log('Opening post with ID:', id);
    this.form.get('recipient')?.setValue('');
  }

  selectRecipient(recipient: Channel | User | Post) {
    const recipientString: any =
      recipient instanceof Channel ? `#${recipient.name}` : `@${recipient.id}`;
    this.form.setValue({ recipient: recipientString });
  }

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

  private filterCurrentUser(results: (Channel | User | Post)[]): (Channel | User | Post)[] {
    return results.filter(result => {
      if (this.isUser(result)) {
        return result.id !== this.currentUser.id;
      }
      return true;
    });
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }

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


  onMouseOver(): void {
    this.menuDown = './../../../../assets/images/icons/keyboard_arrow_down_blue.svg';
  }

  onMouseOut(): void {
    this.menuDown = './../../../../assets/images/icons/keyboard_arrow_down.svg';
  }
}
