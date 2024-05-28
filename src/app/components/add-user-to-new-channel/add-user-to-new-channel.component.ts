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
import { Channel } from '../../models/channel.class';

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
  people: boolean = false;
  channelName: string = '';

  constructor(
    public dialogRef: MatDialogRef<AddUserToNewChannelComponent>,
    private usersService: UsersService,
    private channelsService: ChannelsService,
    @Inject(MAT_DIALOG_DATA) public data: { channelName: string }
  ) {
    this.channelName = data.channelName;
  }

  addUsersToChannel(channelName: string): void {
    this.usersService.getAllUsers().subscribe(users => {
      if (users) {
        users.forEach(user => {
          if (!user.channels.some(channel => channel.name === channelName)) {
            user.channels.push({ id: channelName, name: channelName });
            this.usersService.updateUser(user.id, { channels: user.channels }).then(() => {
              console.log(`User ${user.name} added to channel ${channelName}`);
            }).catch(error => {
              console.error(`Error adding user ${user.name} to channel ${channelName}: `, error);
            });
          } else {
            console.log(`User ${user.name} is already in channel ${channelName}`);
          }
        });
      }
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}