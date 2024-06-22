import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { AddUserToNewChannelMobileComponent } from '../add-user-to-new-channel-mobile/add-user-to-new-channel-mobile.component';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ChannelsService } from '../../../../services/firestore/channels.service';
import { User } from '../../../../models/user.class';
import { SnackbarService } from '../../../../services/snackbar.service';

@Component({
  selector: 'app-new-channel-mobile',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    FormsModule,
    MatDialogModule
  ],
  templateUrl: './new-channel-mobile.component.html',
  styleUrl: './new-channel-mobile.component.scss'
})
export class NewChannelMobileComponent {
  channelName: string = '';
  channelDescription: string = '';

  public currentUser: User = new User();

  constructor(
    private dialog: MatDialog,
    private channelsService: ChannelsService,
    private snackbarService: SnackbarService,
    public dialogRef: MatDialogRef<NewChannelMobileComponent>
  ) { }

  /**
   * Creates a new channel with the provided name and description, and opens a dialog
   * to add users to the newly created channel.
   */
  createChannelAndOpenDialog(): void {
    if (this.channelName.trim()) {
      if (this.channelName.length > 20) {
        this.snackbarService.openSnackBar(
          'Der Channelname darf maximal 20 Zeichen lang sein.',
          'Schließen'
        );
        return;
      }
      this.channelsService.createChannel(this.channelName, this.channelDescription, this.currentUser)
        .then((channel) => {
          this.dialogRef.close();
          this.openAddUserDialog(channel.id, this.channelName);
        })
        .catch(error => console.error('Error creating channel: ', error));
    }
  }

  /**
   * Opens a dialog to add users to a new channel.
   * @param {string} channelId - The ID of the newly created channel.
   * @param {string} channelName - The name of the newly created channel.
   */
  openAddUserDialog(channelId: string, channelName: string): void {
    const dialogRef = this.dialog.open(AddUserToNewChannelMobileComponent, {
      width: '100%',
      position: {
        bottom: '0%'
      },
      data: { channelId: channelId, channelName: channelName  },
    });
  }

  /**
   * Closes the current dialog.
   */
  onNoClick(): void {
    this.dialogRef.close();
  }
}