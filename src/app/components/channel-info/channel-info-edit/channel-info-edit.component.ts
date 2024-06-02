import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Channel } from '../../../models/channel.class';
import { ChannelsService } from '../../../services/firestore/channels.service';
import { User } from '../../../models/user.class';
import { UsersService } from '../../../services/firestore/users.service';

@Component({
  selector: 'app-channel-info-edit',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    FormsModule
  ],
  templateUrl: './channel-info-edit.component.html',
  styleUrls: ['./channel-info-edit.component.scss']
})
export class ChannelInfoEditComponent implements OnInit, OnDestroy {
  updatedName: string;
  updatedDescription: string;
  currentUser: User | null = null;
  channel: Channel | null = null;
  channelSubscription: any;

  private userSubscription: Subscription = new Subscription();

  constructor(
    public dialogRef: MatDialogRef<ChannelInfoEditComponent>,
    private channelsService: ChannelsService,
    private usersService: UsersService,
    @Inject(MAT_DIALOG_DATA) public data: { channelId: string, channelName: string, channelDescription: string }
  ) {
    this.updatedName = data.channelName;
    this.updatedDescription = data.channelDescription;
  }

  ngOnInit(): void {
    this.loadChannelData();
    this.userSubscription = this.usersService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

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
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
