import { Component, OnInit, inject } from '@angular/core';
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
  
  ],

  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss',
})
export class LandingPageComponent implements OnInit {
  usersService = inject(UsersService);
  channelsService = inject(ChannelsService);
  directMessagesService = inject(DirectMessagesService)

  private userSubscription: Subscription = new Subscription();
  private allUsersSubscription: Subscription = new Subscription();
  private allChannelsSubscription: Subscription = new Subscription();

  
  currentUser: User = new User();
  allUsers: User[] = [];
  allChannels: Channel[] = [];

  showContacts: boolean = false;
  showChannels: boolean = true;
  isOpen: boolean = false;
  drawer: any;
  loading: boolean = true;

  users: any = [];
  menuOpen: string ='Workspace-Menü öffnen';
  menuClosed: string ='Workspace-Menü schliessen';
  menuUp: any = './../../../assets/images/icons/menu_up.svg';
  menuDown: any = './../../../assets/images/icons/menu_down.svg';

  constructor() {
    this.usersService.getAllUsers();
    this.channelsService.getAllChannels(); 
  }

  ngOnInit(): void {
    this.userSubscription = this.usersService.currentUser$.subscribe((user) => {
      this.currentUser = user ?? new User;
      console.log('Current User:', this.currentUser);
    });

    this.allUsersSubscription = this.usersService.allUsersSubject$.subscribe((allUsers) => {
      this.allUsers = allUsers ?? [];
      console.log('All Users:', this.allUsers);
      
    });

    this.allChannelsSubscription = this.channelsService.channelSubject$.subscribe((channel) => {
      if (channel) {
        // Überprüfe, ob der empfangene Kanal nicht null ist
        this.allChannels.push(channel); // Füge den Kanal zum Array hinzu
        console.log('All Channels:', this.allChannels);
      }
    });


  }

  showContactsSide() {}

  toggle(drawer: any): void {
    this.isOpen = !this.isOpen;
    console.log('Menu status toggled:', this.isOpen);
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
    if (this.allChannelsSubscription) {
      this.allChannelsSubscription.unsubscribe();
    }
  }
}
