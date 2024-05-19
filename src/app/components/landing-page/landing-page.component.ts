import { Component, OnInit, inject } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

import { HeaderComponent } from '../shared/header/header.component';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ThreadComponent } from './thread/thread.component';
import { MainContentComponent } from './main-content/main-content.component';
import { MatIconModule } from '@angular/material/icon';
import { FirebaseService } from '../../services/firebase.service';
import { User } from '../../models/user.class';
import { Subscription } from 'rxjs';

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
  firebaseService = inject(FirebaseService);

  private userSubscription: Subscription = new Subscription;
  currentUser: User | null = new User();

  showContacts: boolean = false;
  showChannels: boolean = true;
  isOpen: boolean = false;
  drawer: any;
  loading: boolean = true;
  user: any = new User();
  allUsers: any = [];
  users: any = [];
  menuUp: any = './../../../assets/images/icons/add_circle.svg';
  menuDown: any = './../../../assets/images/icons/menu_down.svg';

constructor(){}

  ngOnInit(): void {
    this.userSubscription = this.firebaseService.currentUser$.subscribe((user) => {
      this.currentUser = user;
      console.log('Current User:', this.currentUser);
    });

    this.firebaseService.getAllUsers().then((users) => {
      this.allUsers = users;
      console.log('All Users:', this.allUsers);
    }).catch((error) => {
      console.error('Error fetching all users:', error);
    });
  
  }

  showContactsSide() {}

  toggle() {
    this.isOpen = !this.isOpen; // Hier wird der Wert von isOpen umgeschaltet
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }
}
