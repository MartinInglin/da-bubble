import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Channel } from '../../../../../models/channel.class';
import { ChannelsService } from '../../../../../services/firestore/channels.service';
import { User } from '../../../../../models/user.class';
import { UsersService } from '../../../../../services/firestore/users.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-channel-info-edit-mobile',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    FormsModule
  ],
  templateUrl: './channel-info-edit-mobile.component.html',
  styleUrl: './channel-info-edit-mobile.component.scss'
})
export class ChannelInfoEditMobileComponent implements OnInit, OnDestroy {
  updatedName: string;
  updatedDescription: string;
  currentUser: User | null = null;
  channel: Channel | null = null;
  channelSubscription: any;

  private userSubscription: Subscription = new Subscription();

  constructor(
    public dialogRef: MatDialogRef<ChannelInfoEditMobileComponent>,
    private channelsService: ChannelsService,
    private usersService: UsersService,
    private router: Router,
    @Inject(MAT_DIALOG_DATA) public data: { channelId: string, channelName: string, channelDescription: string }
  ) {
    this.updatedName = data.channelName;
    this.updatedDescription = data.channelDescription;
  }

  /**
  * Initializes the component by loading channel data and subscribing to the current user.
  */
  ngOnInit(): void {
    this.loadChannelData();
    this.userSubscription = this.usersService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
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
        if (channel) {
          this.updatedName = channel.name;
          this.updatedDescription = channel.description || '';
        }
      },
      (error) => {
        console.error('Error loading channel data:', error);
      }
    );
    this.channelsService.getDataChannel(this.data.channelId);
  }

  /**
   * Saves changes made to the channel.
   * Updates the channel with the new name and description.
   */
  saveChanges(): void {
    if (!this.channel) return;

    this.channelsService.updateChannel(this.data.channelId, this.updatedName, this.updatedDescription)
      .then(() => {
        this.dialogRef.close();
      })
      .catch(error => {
        console.error('Fehler beim Speichern der Änderungen:', error);
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
        return this.router.navigate(['/landingPage']);
      })
      .then(() => {
        window.location.reload();
      })
      .catch(error => {
        console.error('Error leaving channel:', error);
      });
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
  /**
   * Closes the dialog without making any changes.
   */
  onNoClick(): void {
    this.dialogRef.close();
  }
}
