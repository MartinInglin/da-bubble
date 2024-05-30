import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

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
export class ProfileDetailViewComponent {
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar: string;

  constructor(
    public dialogRef: MatDialogRef<ProfileDetailViewComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { userId: string, userName: string, userEmail: string, userAvatar: string }
  ) {
    this.userId = data.userId;
    this.userName = data.userName;
    this.userEmail = data.userEmail;
    this.userAvatar = data.userAvatar;

    console.log('Received data:', data);
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
