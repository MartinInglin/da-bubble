import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatRadioModule } from '@angular/material/radio';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { User } from '../../models/user.class';
import { UsersService } from '../../services/firestore/users.service';
import { ChannelsService } from '../../services/firestore/channels.service';
import { MinimalChannel } from '../../models/minimal_channel.class';

@Component({
  selector: 'app-add-user-to-new-channel',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    FormsModule,
    MatRadioModule
  ],
  templateUrl: './add-user-to-new-channel.component.html',
  styleUrls: ['./add-user-to-new-channel.component.scss']
})
export class AddUserToNewChannelComponent {
  peopleType: string = 'all';
  channelId: string = '';

  constructor(
    public dialogRef: MatDialogRef<AddUserToNewChannelComponent>,
    private usersService: UsersService,
    private channelsService: ChannelsService,
    @Inject(MAT_DIALOG_DATA) public data: { channelId: string }
  ) {
    this.channelId = data.channelId;
  }

  addAllUsersToChannel(): void {
    if (this.peopleType === 'all') {
      this.usersService.getAllUsers().subscribe(users => {
        if (users) {
          users.forEach(user => {
            const minimalChannel: MinimalChannel = {
              id: this.channelId,
              name: ''
            };
            this.usersService.addChannelToUsers(minimalChannel);
            this.channelsService.addAllUsersToChannel(this.channelId);
          });
        }
      });

      this.dialogRef.close();
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
