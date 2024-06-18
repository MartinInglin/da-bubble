import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AddUserToChannelComponent } from '../add-user-to-channel/add-user-to-channel.component';
import { ProfileDetailViewComponent } from '../profile-detail-view/profile-detail-view.component';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ChannelsService } from '../../../services/firestore/channels.service';
import { MinimalUser } from '../../../models/minimal_user.class';
import { User } from '../../../models/user.class';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-members',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule
  ],
  templateUrl: './members.component.html',
  styleUrls: ['./members.component.scss']
})
export class MembersComponent implements OnInit, OnDestroy {
  users: User[] = [];

  private dialogRefSubscription: Subscription | undefined;

  constructor(
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<MembersComponent>,
    private channelsService: ChannelsService,
    @Inject(MAT_DIALOG_DATA) public data: { channelId: string }
  ) { }

/**
 * Lifecycle hook that is called after data-bound properties of a directive are initialized.
 * Loads the channel members.
 */
ngOnInit(): void {
  this.loadChannelMembers();
}

/**
 * Loads the members of the channel by fetching minimal user information and then
 * retrieving full user details for each member.
 * @returns {Promise<void>}
 */
async loadChannelMembers(): Promise<void> {
  try {
    const minimalUsers: MinimalUser[] = await this.channelsService.getUsersInChannel(this.data.channelId);
    this.users = await Promise.all(minimalUsers.map(async (minimalUser) => {
      const user = await this.channelsService.getUserById(minimalUser.id);
      return new User(user);
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
  }
}

/**
 * Opens a dialog to view the details of a user.
 * @param {MinimalUser} user - The minimal user information.
 */
openDetailViewDialog(user: MinimalUser): void {
  const dialogRef = this.dialog.open(ProfileDetailViewComponent, {
    width: '500px',
    data: {
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userAvatar: user.avatar
    }
  });

  this.dialogRefSubscription = dialogRef.afterClosed().subscribe(() => {});
}

/**
 * Opens a dialog to add a user to the channel.
 */
openAddUserToChannelDialog(): void {
  this.dialogRef.close();

  const dialogRef = this.dialog.open(AddUserToChannelComponent, {
    width: '800px',
    height: '800px',
    position: {
      top: '200px',
      right: '-200px',
    },
    data: {
      channelId: this.data.channelId
    }
  });
}

/**
 * Closes the current dialog.
 */
onNoClick(): void {
  this.dialogRef.close();
}

/**
 * Lifecycle hook that is called when the directive is destroyed.
 * Unsubscribes from the dialogRef subscription if it exists.
 */
ngOnDestroy(): void {
  if (this.dialogRefSubscription) {
    this.dialogRefSubscription.unsubscribe();
  }
}
}
