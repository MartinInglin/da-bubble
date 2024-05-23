import { Component, Inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ChannelInfoEditComponent } from './channel-info-edit/channel-info-edit.component';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Channel } from '../../models/channel.class';
import { ChannelsService } from '../../services/firestore/channels.service';
import { OnInit } from '@angular/core';

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
    MatDialogModule
  ],
  templateUrl: './channel-info.component.html',
  styleUrl: './channel-info.component.scss',
})
export class ChannelInfoComponent implements OnInit {
  channel: Channel | null = null;
  channelSubscription: any;

  constructor(
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<ChannelInfoComponent>,
    private channelsService: ChannelsService,
    @Inject(MAT_DIALOG_DATA) public data: {channelId: string}
  ) {}

  ngOnInit(): void {
    this.loadChannelData();
  }


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


  openDialog(): void {
    const dialogRef = this.dialog.open(ChannelInfoEditComponent, {
      width: '872px',
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
