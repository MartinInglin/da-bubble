import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatRadioModule } from '@angular/material/radio';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UsersService } from '../../../../services/firestore/users.service';
import { ChannelsService } from '../../../../services/firestore/channels.service';
import { MinimalChannel } from '../../../../models/minimal_channel.class';
import { Subscription } from 'rxjs';
import { User } from '../../../../models/user.class';
import { MinimalUser } from '../../../../models/minimal_user.class';

@Component({
  selector: 'app-add-user-to-new-channel-mobile',
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
  templateUrl: './add-user-to-new-channel-mobile.component.html',
  styleUrl: './add-user-to-new-channel-mobile.component.scss'
})
export class AddUserToNewChannelMobileComponent {
  peopleType: string = 'all';
  channelId: string = '';
  currentUser: User | null = null;
  selectedUser: User | null = null;
  allUsers: User[] = [];
  filteredUsers: User[] = [];
  selectedUsers: string[] = [];
  showResults: boolean = false;

  private usersSubscription: Subscription | undefined;
  private allUsersSubscription: Subscription = new Subscription();
  private userSubscription: Subscription = new Subscription();

  constructor(
    public dialogRef: MatDialogRef<AddUserToNewChannelMobileComponent>,
    private usersService: UsersService,
    public channelsService: ChannelsService,
    @Inject(MAT_DIALOG_DATA) public data: { channelId: string }
  ) {
    this.channelId = data.channelId;
  }

  ngOnInit(): void {
    this.userSubscription = this.usersService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    
    this.allUsersSubscription = this.usersService.allUsersSubject$.subscribe(
      (allUsers) => {
        this.allUsers = allUsers ?? [];
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

  onSearchChange(event: Event): void {
    const searchValue = (event.target as HTMLInputElement).value;
    if (!searchValue) {
      this.filteredUsers = [];
      this.showResults = false;
    } else {
      this.filteredUsers = this.allUsers.filter(user =>
        (!this.currentUser || user.id !== this.currentUser.id) &&
        !this.selectedUsers.includes(user.id) &&
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
    this.updateFilteredUsers();
  }

  isSelected(userId: string): boolean {
    return this.selectedUsers.includes(userId);
  }

  updateFilteredUsers(): void {
    const searchValue = (document.querySelector('input[placeholder="Name eingeben"]') as HTMLInputElement)?.value;
    this.filteredUsers = this.allUsers.filter(user =>
      (!this.currentUser || user.id !== this.currentUser.id) &&
      !this.selectedUsers.includes(user.id) &&
      user.name.toLowerCase().includes(searchValue?.toLowerCase() || '')
    );
  }

  async addUsersToChannel(): Promise<void> {
    if (this.peopleType === 'specific') {
      for (const userId of this.selectedUsers) {
        const user = this.allUsers.find(u => u.id === userId);
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
            await this.usersService.addChannelToSingleUser(user.id, {
              id: channel.id,
              name: channel.name
            });
          }
        }
      }
      this.dialogRef.close();
    }
  }

  getSelectedUsers(): User[] {
    return this.selectedUsers.map(userId => {
      return this.allUsers.find(u => u.id === userId) as User;
    });
  }

  onSubmit(): void {
    if (this.peopleType === 'all') {
      this.addAllUsersToChannel();
    } else if (this.peopleType === 'specific') {
      this.addUsersToChannel();
    }
  }

  onOutsideClick(event: Event): void {
    if (!(event.target as HTMLElement).closest('.user-list')) {
      this.showResults = false;
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    if (this.usersSubscription) {
      this.usersSubscription.unsubscribe();
    }
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    if (this.allUsersSubscription) {
      this.allUsersSubscription.unsubscribe();
    }
  }
}
