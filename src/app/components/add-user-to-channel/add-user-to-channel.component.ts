import { Component, OnInit, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UsersService } from '../../services/firestore/users.service';
import { User } from '../../models/user.class';
import { ChannelsService } from '../../services/firestore/channels.service';
import { MinimalUser } from '../../models/minimal_user.class';
import { MinimalChannel } from '../../models/minimal_channel.class';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-add-user-to-channel',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    FormsModule
  ],
  templateUrl: './add-user-to-channel.component.html',
  styleUrl: './add-user-to-channel.component.scss'
})
export class AddUserToChannelComponent implements OnInit {
  usersService = inject(UsersService)

  users: User[] = [];
  usersInChannel: MinimalUser[] = [];
  filteredUsers: User[] = [];
  selectedUsers: string[] = [];
  showResults: boolean = false;
  allUsers: User[] = [];

  private allUsersSubscription: Subscription = new Subscription();

  constructor(
    public dialogRef: MatDialogRef<AddUserToChannelComponent>,
    private userService: UsersService,
    private channelsService: ChannelsService,
    @Inject(MAT_DIALOG_DATA) public data: { channelId: string }
  ) { }

  ngOnInit(): void {
    this.allUsersSubscription = this.usersService.allUsersSubject$.subscribe(
      (allUsers) => {
        this.allUsers = allUsers ?? [];
        console.log('All Users:', this.allUsers);
      }
    );
    this.loadChannelMembers();
  }

  async loadChannelMembers(): Promise<void> {
    try {
      this.usersInChannel = await this.channelsService.getUsersInChannel(this.data.channelId);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }

  onSearchChange(event: Event): void {
    const searchValue = (event.target as HTMLInputElement).value;
    if (!searchValue) {
      this.filteredUsers = [];
      this.showResults = false;
    } else {
      this.filteredUsers = this.users.filter(user =>
        !this.usersInChannel.some(u => u.id === user.id) &&
        user.name.toLowerCase().includes(searchValue.toLowerCase())
      );
      this.showResults = true;
    }
  }

  selectUser(userId: string): void {
    if (this.selectedUsers.includes(userId)) {
      this.selectedUsers = this.selectedUsers.filter(id => id !== userId);
    } else {
      this.selectedUsers.push(userId);
    }
    this.showResults = false;
  }

  getSelectedUsersDisplay(): string {
    return this.selectedUsers.map(userId => {
      const user = this.users.find(u => u.id === userId);
      return user ? user.name : '';
    }).join(', ');
  }

  async addUsersToChannel(): Promise<void> {
    for (const userId of this.selectedUsers) {
      const user = this.users.find(u => u.id === userId);
      if (user) {
        const minimalUser: MinimalUser = {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          email: user.email
        };
        await this.channelsService.addSingleUserToChannel(this.data.channelId, minimalUser);
        
        const channel = await this.channelsService.getChannelById(this.data.channelId);
        if (channel) {
          await this.userService.addChannelToSingleUser(user.id, {
            id: channel.id,
            name: channel.name
          });
        }
      }
    }
    this.dialogRef.close();
  }
  

  onNoClick(): void {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    if (this.allUsersSubscription) {
      this.allUsersSubscription.unsubscribe();
    }
  }
}
