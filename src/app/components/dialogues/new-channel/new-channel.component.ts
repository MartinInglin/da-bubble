import { Component} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { AddUserToNewChannelComponent } from '../add-user-to-new-channel/add-user-to-new-channel.component';
import { MatDialog, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import { ChannelsService } from '../../../services/firestore/channels.service';
import { User } from '../../../models/user.class';

@Component({
  selector: 'app-new-channel',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    FormsModule,
    MatDialogModule
  ],
  templateUrl: './new-channel.component.html',
  styleUrl: './new-channel.component.scss'
})
export class NewChannelComponent {
  channelName: string = '';
  channelDescription: string = '';
  
  public currentUser: User = new User();

  constructor(
    private dialog: MatDialog,
    private channelsService: ChannelsService,
    public dialogRef: MatDialogRef<NewChannelComponent>
  ) {}

  createChannelAndOpenDialog(): void {
    if (this.channelName.trim()) {
      this.channelsService.createChannel(this.channelName, this.channelDescription, this.currentUser)
        .then((channel) => {
          this.dialogRef.close();
          this.openAddUserDialog(channel.id);
        })
        .catch(error => console.error('Error creating channel: ', error));
    }
  }
  
  openAddUserDialog(channelId: string): void {
    const dialogRef = this.dialog.open(AddUserToNewChannelComponent, {
      width: '710px',
      position: {
        top: '20%'
      },
      data: { channelId: channelId },
      panelClass: 'custom-dialog-container'
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
