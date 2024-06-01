import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { Channel } from '../../models/channel.class';
import { HeaderComponent } from '../shared/header/header.component';
import { ThreadComponent } from './thread/thread.component';
import { MainContentComponent } from './main-content/main-content.component';
import { MatIconModule } from '@angular/material/icon';
import { User } from '../../models/user.class';
import { Subscription } from 'rxjs';
import { UsersService } from '../../services/firestore/users.service';
import { ChannelsService } from '../../services/firestore/channels.service';
import { DirectMessagesService } from '../../services/firestore/direct-messages.service';
import { NewChannelComponent } from '../new-channel/new-channel.component';
import {
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { StateService } from '../../services/stateservice.service';


@Component({
  selector: 'app-landing-page',
  standalone: true,

  imports: [
    MatSidenavModule,
    MatButtonModule,
    CommonModule,
    ThreadComponent,
    MainContentComponent,
    MatIconModule,
    HeaderComponent,
    NewChannelComponent,
    MatDialogModule,
  ],

  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss',
})
export class LandingPageComponent implements OnInit, OnDestroy {
  openThreadEvent: EventEmitter<boolean> = new EventEmitter<boolean>();

  usersService = inject(UsersService);
  channelsService = inject(ChannelsService);
  directMessagesService = inject(DirectMessagesService);
  stateService = inject(StateService)

  private userSubscription: Subscription = new Subscription();
  private allUsersSubscription: Subscription = new Subscription();

  currentUser: User = new User();
  allUsers: User[] = [];
  i: any = ([] = '');

  showContacts: boolean = false;
  showChannels: boolean = false;
  isOpen: boolean = false;
  drawer: any;
  loading: boolean = true;
  isThreadOpen: boolean = false;

  arrowOpen: any = '/assets/images/icons/arrow_drop_up.svg';
  arrowClosed: any = '/assets/images/icons/arrow_drop_down.svg';


  users: any = [];
  menuOpen: string = 'Workspace-Menü öffnen';
  menuClosed: string = 'Workspace-Menü schliessen';
  menuUp: any = '/assets/images/icons/menu_up.svg';
  menuDown: any = '/assets/images/icons/menu_down.svg';

  constructor(private dialog: MatDialog) {}

  ngOnInit(): void {
    this.allUsersSubscription = this.usersService.allUsersSubject$.subscribe(
      (allUsers) => {
        this.allUsers = allUsers ?? [];
        console.log('All Users:', this.allUsers);
      }
    );

    this.userSubscription = this.usersService.currentUser$.subscribe((user) => {
      if (user) {
        // Überprüfe, ob ein Benutzerobjekt vorhanden ist
        this.currentUser = user ?? new User(); // Weise das Benutzerobjekt direkt zu
        console.log('Current User:', this.currentUser);
      }
    });

    this.stateService.showContacts$.subscribe(show => {
      this.showContacts = show;
    });

    this.stateService.showChannels$.subscribe(show => {
      this.showChannels = show;
    });
  }

  async getAllUsers() {
    this.usersService.getAllUsers();
  }

  getAllChannelsForUser(userId: string): void {
    // Hier kannst du die Kanäle abrufen, denen der Benutzer beigetreten ist, basierend auf der Benutzer-ID
  }

  showContactsSide() {}

  toggle(drawer: any): void {
    this.isOpen = !this.isOpen;
    if (drawer) {
      drawer.toggle(); // Ensure this method exists and works as expected
    }
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    if (this.allUsersSubscription) {
      this.allUsersSubscription.unsubscribe();
    }
  }

  openNewChannelDialog(): void {
    const dialogRef = this.dialog.open(NewChannelComponent, {
      width: '872px',
      height: '539px',
    });
    dialogRef.componentInstance.currentUser = new User(this.currentUser);
  }

  toggleThread(isOpen: boolean): void {
    this.isThreadOpen = isOpen;
  }

  closeChannelsAndContacts(){
    console.log('hallo');
    this.stateService.setShowContacts(false);
    this.stateService.setShowChannels(false);
  }
}
