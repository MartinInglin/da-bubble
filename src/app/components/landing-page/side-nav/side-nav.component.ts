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

  ngOnInit(): void {
    this.subscribeToShowContacts();
    this.subscribeToShowChannels();
    this.subscribeToAllUsers();
    this.fetchDirectMessagesAndPosts();
    this.subscribeToSideNavState();
    this.initializeFilteredChannels();
  }

  private initializeFilteredChannels(): void {
    const channels: Channel[] = this.currentUser.channels.map(
      (minimalChannel) => new Channel(minimalChannel)
    );
    this.filteredChannels = channels.filter((c) =>
      c.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  subscribeToShowContacts(): void {
    this.stateService.showContacts$.subscribe((show) => {
      this.showContacts = show;
    });
  }

  subscribeToShowChannels(): void {
    this.stateService.showChannels$.subscribe((show) => {
      this.showChannels = show;
    });
  }

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

  subscribeToSideNavState(): void {
    this.sideNavSubscription = this.stateService.sideNavOpen$.subscribe((isOpen) => {
      this.isSideNavOpen = isOpen;
      if (isOpen) {
        this.stateService.closeThread();
      }
    });
  }

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: MouseEvent): void {
    if (this.searchResultsList && !this.searchResultsList.nativeElement.contains(event.target)) {
      this.closeSearchResults();
    }
  }

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

  private showNoResultsMessage(): void {
    this.showNoResults = true;
    setTimeout(() => {
      this.showNoResults = false;
    }, 5000);
  }

  getDataChannel(channelId: string) {
    this.channelsService.getDataChannel(channelId);
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

  isPost(result: Channel | User | Post): result is Post {
    return (result as Post).message !== undefined;
  }

  closeSideNav() {
    this.isOpen = false;
  }

  isScreenWidthBelow(width: number): boolean {
    return window.innerWidth < width;
  }

  closeSidenavMobile() {
    if (this.isScreenWidthBelow(1360)) {
      this.toggleDrawer.emit();
      this.stateService.closeThread();
    }
  }

  closeSidenavMobileAfterContacts() {
    if (this.isScreenWidthBelow(1360)) {
      this.toggleDrawer.emit();
      this.stateService.closeThread();
    }
  }

  search(searchTerm: string): Observable<(Channel | User | Post)[]> {
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

  private filterCurrentUser(results: (Channel | User | Post)[]): (Channel | User | Post)[] {
    return results.filter(result => {
      if (this.isUser(result)) {
        return result.id !== this.currentUser.id;
      }
      return true;
    });
  }

  openChannel(id: string) {
    this.channelsService.getDataChannel(id);
    this.form.get('recipient')?.setValue('');
    if (this.isOpen) {
      this.toggleDrawer.emit();
      this.stateService.closeThread();
    }
  }

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

  scrollToPost(postId: string): void {
    setTimeout(() => {
      const element = document.getElementById(`post-${postId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        this.highlightPost(element);
      }
    }, 500);
  }

  highlightPost(element: HTMLElement): void {
    element.classList.add('highlight');
    setTimeout(() => {
      element.classList.remove('highlight');
    }, 5000);
  }

  openDirectMessage(id: string, data: any) {
    this.directMessagesService.getDataDirectMessage(id, data);
    this.form.get('recipient')?.setValue('');
    if (this.isOpen) {
      this.toggleDrawer.emit();
      this.stateService.closeThread();
    }
  }

  closeChannelsAndContacts() {
    this.stateService.setShowContacts(false);
    this.stateService.setShowChannels(false);
  }

  async getAllUsers() {
    this.usersService.getAllUsers();
  }

  getFirstAndLastName(name: string): string {
    const words = name.split(' ');
    if (words.length > 1) {
      return `${words[0]} ${words[words.length - 1]}`;
    }
    return name;
  }

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
