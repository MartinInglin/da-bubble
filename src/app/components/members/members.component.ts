import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ProfileDetailViewComponent } from '../profile-detail-view/profile-detail-view.component';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ChannelsService } from '../../services/firestore/channels.service';
import { MinimalUser } from '../../models/minimal_user.class';


@Component({
  selector: 'app-members',
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
  templateUrl: './members.component.html',
  styleUrl: './members.component.scss'
})

export class MembersComponent {
  users: MinimalUser[] = [];
  private dialogRefSubscription: any;

  constructor(
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<MembersComponent>,
    private channelsService: ChannelsService,
    @Inject(MAT_DIALOG_DATA) public data: {channelId: string}
  ) {}

  ngOnInit(): void {
    this.loadChannelMembers();
  }

  async loadChannelMembers(): Promise<void> {
    try {
      this.users = await this.channelsService.getUsersInChannel(this.data.channelId);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }
  

  openDetailViewDialog(userId: string): void {
    const dialogRef = this.dialog.open(ProfileDetailViewComponent, {
      width: '500px',
      data: { userId: userId }
    });
    this.dialogRefSubscription = dialogRef.afterClosed().subscribe(() => {
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    if (this.dialogRefSubscription) {
      this.dialogRefSubscription.unsubscribe();
    }
  }
}
