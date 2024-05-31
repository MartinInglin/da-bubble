import { Component, Inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatRadioModule } from '@angular/material/radio';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UsersService } from '../../services/firestore/users.service';
import { ChannelsService } from '../../services/firestore/channels.service';
import { MinimalChannel } from '../../models/minimal_channel.class';
import { Subscription } from 'rxjs';
import { User } from '../../models/user.class';

@Component({
  selector: 'app-add-user-to-new-channel',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    FormsModule,
    MatRadioModule,
    MatSelectModule,
  ],
  templateUrl: './add-user-to-new-channel.component.html',
  styleUrls: ['./add-user-to-new-channel.component.scss'],
})
export class AddUserToNewChannelComponent implements OnDestroy {
  peopleType: string = 'all';
  channelId: string = '';
  selectedUser: User | null = null;
  userList: User[] = [];
  allUsers: User[] = [];

  private usersSubscription: Subscription | undefined;
  private allUsersSubscription: Subscription = new Subscription();

  constructor(
    public dialogRef: MatDialogRef<AddUserToNewChannelComponent>,
    private usersService: UsersService,
    private channelsService: ChannelsService,
    @Inject(MAT_DIALOG_DATA) public data: { channelId: string }
  ) {
    this.channelId = data.channelId;
  }

  ngOnInit(): void {
    this.allUsersSubscription = this.usersService.allUsersSubject$.subscribe(
      (allUsers) => {
        this.allUsers = allUsers ?? [];
        console.log('All Users:', this.allUsers);
      }
    );
  }

  addAllUsersToChannel(): void {
    if (this.peopleType === 'all') {
      if (this.allUsers) {
        this.allUsers.forEach((user) => {
          const minimalChannel: MinimalChannel = {
            id: this.channelId,
            name: '',
          };
          this.usersService.addChannelToUsers(minimalChannel);
          this.channelsService.addAllUsersToChannel(this.channelId);
        });
      }

      this.dialogRef.close();
    }
  }

  getUsersList(): void {
    this.userList = this.allUsers;
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    if (this.usersSubscription) {
      this.usersSubscription.unsubscribe();
    }
    if (this.allUsersSubscription) {
      this.allUsersSubscription.unsubscribe();
    }
  }
}
