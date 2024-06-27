import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ChannelInfoEditMobileComponent } from './channel-info-edit-mobile/channel-info-edit-mobile.component';
import { StateService } from '../../../../services/stateservice.service';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Channel } from '../../../../models/channel.class';
import { ChannelsService } from '../../../../services/firestore/channels.service';
import { User } from '../../../../models/user.class';
import { UsersService } from '../../../../services/firestore/users.service';
import { MinimalUser } from '../../../../models/minimal_user.class';

@Component({
  selector: 'app-channel-info-mobile',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule
  ],
  templateUrl: './channel-info-mobile.component.html',
  styleUrl: './channel-info-mobile.component.scss'
})
export class ChannelInfoMobileComponent {
  channel: Channel | null = null;
  currentUser: User | null = null;
  users: User[] = [];

  channelSubscription: any;

  private userSubscription: Subscription = new Subscription();
  private allUsersSubscription: Subscription = new Subscription();
  

  constructor(
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<ChannelInfoMobileComponent>,
    private channelsService: ChannelsService,
    private usersService: UsersService,
    private stateService: StateService,
    @Inject(MAT_DIALOG_DATA) public data: { channelId: string }
  ) { }

  /**
   * Initializes the component by loading channel data and subscribing to the current user.
   */
  ngOnInit(): void {
    this.loadChannelData();
    this.loadChannelMembers();
    this.userSubscription = this.usersService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

    /**
  * Asynchronously loads the members of the channel by fetching minimal user information and then
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
   * Loads the data of the current channel.
   * Subscribes to the channelSubject$ to receive updates about the channel.
   */
  loadChannelData(): void {
    if (!this.data.channelId) return;
    this.channelSubscription = this.channelsService.channelSubject$.subscribe(
      (channel) => {
        this.channel = channel;
      },
      (error) => {
        console.error('Error loading channel data:', error);
      }
    );
    this.channelsService.getDataChannel(this.data.channelId);
  }

  /**
   * Opens a dialog to edit channel information.
   */
  openDialog(): void {
    if (!this.channel) return;
    const dialogRef = this.dialog.open(ChannelInfoEditMobileComponent, {
      width: '100%',
      height: '100vh',
      data: {
        channelId: this.channel.id,
        name: this.channel.name,
        description: this.channel.description
      }
    });
  }

  /**
   * Removes the current user from the channel and updates the state.
   */
  leaveChannel(): void {
    if (!this.currentUser || !this.channel) return;

    const channelId = this.channel.id;
    const currentUserId = this.currentUser.id;

    this.channelsService.removeUserFromChannel(channelId, currentUserId)
      .then(() => {
        this.dialogRef.close();
      })
      .catch(error => {
        console.error('Error leaving channel:', error);
      });

    this.stateService.setShowContacts(false);
    this.stateService.setShowChannels(false);
  }

  /**
   * Closes the dialog without making any changes.
   */
  onNoClick(): void {
    this.dialogRef.close();
  }

  /**
   * Cleans up subscriptions when the component is destroyed.
   */
  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    if (this.channelSubscription) {
      this.channelSubscription.unsubscribe();
    }
  }
}
