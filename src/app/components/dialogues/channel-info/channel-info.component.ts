import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ChannelInfoEditComponent } from './channel-info-edit/channel-info-edit.component';
import { StateService } from '../../../services/stateservice.service';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Channel } from '../../../models/channel.class';
import { ChannelsService } from '../../../services/firestore/channels.service';
import { User } from '../../../models/user.class';
import { UsersService } from '../../../services/firestore/users.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-channel-info',
  template: 'passed in {{ data.channelId}}',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
  ],
  templateUrl: './channel-info.component.html',
  styleUrl: './channel-info.component.scss',
})
export class ChannelInfoComponent implements OnInit, OnDestroy {
  channel: Channel | null = null;
  currentUser: User | null = null;
  
  channelSubscription: any;

  private userSubscription: Subscription = new Subscription();

  constructor(
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<ChannelInfoComponent>,
    private channelsService: ChannelsService,
    private usersService: UsersService,
    private stateService: StateService,
    private router: Router,
    @Inject(MAT_DIALOG_DATA) public data: { channelId: string }
  ) { }

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
      const dialogRef = this.dialog.open(ChannelInfoEditComponent, {
        width: '872px',
        position: {
          top: '185px',
          right: '180px',
        },
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
  
        this.router.navigate(['/landingPage']).then(() => {
          window.location.reload();
        });
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
