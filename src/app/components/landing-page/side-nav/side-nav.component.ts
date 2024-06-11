import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject } from '@angular/core';
import { StateService } from '../../../services/stateservice.service';
import { NewChannelComponent } from '../../dialogues/new-channel/new-channel.component';
import { NewChannelMobileComponent } from '../../dialogues/mobile/new-channel-mobile/new-channel-mobile.component';
import { User } from '../../../models/user.class';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ChannelsService } from '../../../services/firestore/channels.service';
import { DirectMessagesService } from '../../../services/firestore/direct-messages.service';
import { UsersService } from '../../../services/firestore/users.service';
import { Observable, Subscription, debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { Channel } from '../../../models/channel.class';

@Component({
  selector: 'app-side-nav',
  standalone: true,
  imports: [CommonModule, NewChannelComponent, MatDialogModule, FormsModule,
    ReactiveFormsModule],
  templateUrl: './side-nav.component.html',
  styleUrl: './side-nav.component.scss',
})
export class SideNavComponent {
  usersService = inject(UsersService);
  stateService = inject(StateService);
  channelsService = inject(ChannelsService);
  directMessagesService = inject(DirectMessagesService);

  @Input() currentUser: User = new User();

  private allUsersSubscription: Subscription = new Subscription();
  private showContactsSubscription: Subscription = new Subscription();
  private showChannelsSubscription: Subscription = new Subscription();

  form: FormGroup;
  searchTerm: string = '';
  searchResults$: Observable<(Channel | User)[]> = of([]);
  searchResults: (Channel | User)[] | undefined;
  allUsers: User[] = [];
  filteredUsers: User[] = [];
  filteredChannels: Channel[] = [];

  showContacts: boolean = false;
  showChannels: boolean = false;
  isDialogOpen: boolean = false;

  arrowOpen: any = '/assets/images/icons/arrow_drop_up.svg';
  arrowClosed: any = '/assets/images/icons/arrow_drop_down.svg';

  constructor(private dialog: MatDialog,private fb: FormBuilder,) { 
    // this.directMessagesService = directMessagesService;
    this.form = this.fb.group({
      recipient: [''],
    });
  }

  ngOnInit(): void {
    this.stateService.showContacts$.subscribe((show) => {
      this.showContacts = show;
    });

    this.stateService.showChannels$.subscribe((show) => {
      this.showChannels = show;
    });

    // this.allUsersSubscription = this.usersService.allUsersSubject$.subscribe(
    //   (allUsers) => {
    //     this.allUsers = allUsers ?? [];
    //   }
    // );

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

  get recipient(): FormControl {
    return this.form.get('recipient') as FormControl;
  }

  isUser(result: Channel | User): result is User {
    return (result as User).avatar !== undefined;
  }

  search(searchTerm: string): Observable<(Channel | User)[]> {
    // Suche nach Kanälen
    if (searchTerm.startsWith('#')) {
      const filteredChannels = this.filteredChannels.filter((channel) =>
        channel.name.toLowerCase().includes(searchTerm.slice(1).toLowerCase()) && !channel.isDirectMessage // Entfernen Sie "#" aus dem Suchbegriff
      );
      return of(filteredChannels);
    }
    // Suche nach Benutzern
    else if (searchTerm.startsWith('@')) {
      const filteredUsers = this.allUsers.filter((user) =>
        user.name.toLowerCase().includes(searchTerm.slice(1).toLowerCase()) && !user.isChannel // Entfernen Sie "@" aus dem Suchbegriff
      );
      return of(filteredUsers);
    }
    // Allgemeine Suche (ohne Präfix)
    else {
      const filteredChannels = this.filteredChannels.filter((channel) =>
        channel.name.toLowerCase().includes(searchTerm.toLowerCase()) && !channel.isDirectMessage
      );
      const filteredUsers = this.allUsers.filter((user) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) && !user.isChannel
      );
  
      // Zusammenführen der Suchergebnisse
      const results = [...filteredChannels, ...filteredUsers];
      return of(results);
    }
  }

  openChannel(x:string){
    this.channelsService.getDataChannel(x);
    this.form.get('recipient')?.setValue(''); 
  }

  openDirectMessage(x:string, y: any){
    this.directMessagesService.getDataDirectMessage(x , y);
    this.form.get('recipient')?.setValue(''); 
  }

  closeChannelsAndContacts() {
    this.stateService.setShowContacts(false);
    this.stateService.setShowChannels(false);
  }

  async getAllUsers() {
    this.usersService.getAllUsers();
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
  }
}
