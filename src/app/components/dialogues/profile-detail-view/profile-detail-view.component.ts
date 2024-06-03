import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ChannelsService } from '../../../services/firestore/channels.service';
import { User } from '../../../models/user.class';

@Component({
  selector: 'app-profile-detail-view',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './profile-detail-view.component.html',
  styleUrls: ['./profile-detail-view.component.scss']
})
export class ProfileDetailViewComponent implements OnInit {
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar: string;
  isSignedIn: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<ProfileDetailViewComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { userId: string, userName: string, userEmail: string, userAvatar: string },
    private channelsService: ChannelsService
  ) {
    this.userId = data.userId;
    this.userName = data.userName;
    this.userEmail = data.userEmail;
    this.userAvatar = data.userAvatar;

    console.log('Received data:', data);
  }

  async ngOnInit(): Promise<void> {
    try {
      const user = await this.channelsService.getUserById(this.userId);
      this.isSignedIn = user.isSignedIn;
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}