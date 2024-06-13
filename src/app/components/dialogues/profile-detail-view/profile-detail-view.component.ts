import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MembersComponent } from '../members/members.component';
import { ChannelsService } from '../../../services/firestore/channels.service';
import { DirectMessagesService } from '../../../services/firestore/direct-messages.service';
import { User } from '../../../models/user.class';
import { UsersService } from '../../../services/firestore/users.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-profile-detail-view',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './profile-detail-view.component.html',
  styleUrls: ['./profile-detail-view.component.scss']
})
export class ProfileDetailViewComponent implements OnInit {
  private userSubscription: Subscription = new Subscription();
  directMessagesService = inject(DirectMessagesService);
  usersService = inject(UsersService);
  channelsService = inject(ChannelsService)

  userId: string;
  userName: string;
  userEmail: string;
  userAvatar: string;
  isSignedIn: boolean = false;

  currentUser: User | null = null;
  allUsers: User[] = [];

  constructor(
    public dialogRef: MatDialogRef<ProfileDetailViewComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { userId: string, userName: string, userEmail: string, userAvatar: string },
  ) {
    this.userId = data.userId;
    this.userName = data.userName;
    this.userEmail = data.userEmail;
    this.userAvatar = data.userAvatar;

    console.log('Received data:', data);
  }

  async ngOnInit(): Promise<void> {
    try {
      const userSubscription = this.usersService.currentUser$.subscribe(user => {
        this.currentUser = user;
      });
      const user = await this.channelsService.getUserById(this.userId);
      this.isSignedIn = user.isSignedIn;
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  async getAllUsers() {
    this.usersService.getAllUsers();
  }

  async sendDirectMessage() {
    console.log('User ID:', this.userId);
    console.log('Current User:', this.currentUser);
    if (this.currentUser) {
      try {
        await this.directMessagesService.getDataDirectMessage(this.userId, this.currentUser);
        this.onNoClick();
      } catch (error) {
        console.error('Error sending direct message:', error);
      }
    } else {
      console.error('Current user is not set.');
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
