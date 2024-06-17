import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UsersService } from '../../../services/firestore/users.service';
import { User } from '../../../models/user.class';
import { ChannelsService } from '../../../services/firestore/channels.service';
import { MinimalUser } from '../../../models/minimal_user.class';
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
  styleUrls: ['./add-user-to-channel.component.scss']
})
export class AddUserToChannelComponent implements OnInit, OnDestroy {
  users: User[] = [];
  usersInChannel: MinimalUser[] = [];
  filteredUsers: User[] = [];
  selectedUsers: string[] = [];
  allUsers: User[] = [];

  showResults: boolean = false;

  channelName: string = '';

  private allUsersSubscription: Subscription = new Subscription();

  constructor(
    public dialogRef: MatDialogRef<AddUserToChannelComponent>,
    private userService: UsersService,
    private channelsService: ChannelsService,
    @Inject(MAT_DIALOG_DATA) public data: { channelId: string }
  ) { }

  /**
 * Initializes component state and subscribes to necessary observables.
 * Loads channel members and name upon component initialization.
 */
  ngOnInit(): void {
    this.allUsersSubscription = this.userService.allUsersSubject$.subscribe(
      (allUsers) => {
        this.allUsers = allUsers ?? [];
      }
    );

    this.loadChannelMembers();
    this.loadChannelName();
  }

  /**
   * Asynchronously loads users currently in the channel.
   * Handles errors encountered during the loading process.
   * @returns Promise<void>
   */
  async loadChannelMembers(): Promise<void> {
    try {
      this.usersInChannel = await this.channelsService.getUsersInChannel(this.data.channelId);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }

  /**
   * Asynchronously loads the name of the current channel.
   * Sets channelName if channel data is successfully retrieved.
   * @returns Promise<void>
   */
  async loadChannelName(): Promise<void> {
    try {
      const channel = await this.channelsService.getChannelById(this.data.channelId);
      if (channel) {
        this.channelName = channel.name;
      }
    } catch (error) {
      console.error('Error fetching channel name:', error);
    }
  }

  /**
   * Handles input change in the search field to filter users based on search criteria.
   * Updates filteredUsers and controls visibility of search results.
   * @param event - Event object containing the input change event
   */
  onSearchChange(event: Event): void {
    const searchValue = (event.target as HTMLInputElement).value.toLowerCase().trim();
    if (!searchValue) {
      this.filteredUsers = [];
      this.showResults = false;
    } else {
      this.filteredUsers = this.allUsers.filter(user =>
        !this.usersInChannel.some(u => u.id === user.id) &&
        user.name.toLowerCase().includes(searchValue) &&
        !this.selectedUsers.includes(user.id)
      );
      this.showResults = true;
    }
  }

  /**
   * Handles selection of a user in the search results.
   * Toggles selection of the user by adding or removing from selectedUsers.
   * @param userId - ID of the user being selected
   */
  selectUser(userId: string): void {
    if (this.selectedUsers.includes(userId)) {
      this.selectedUsers = this.selectedUsers.filter(id => id !== userId);
    } else {
      this.selectedUsers.push(userId);
    }
    this.showResults = false;
    (document.getElementById('userInput') as HTMLInputElement).value = '';
  }

  /**
   * Retrieves full user objects for all selected users.
   * @returns Array of User objects representing selected users
   */
  getSelectedUsers(): User[] {
    return this.selectedUsers.map(userId => {
      return this.allUsers.find(u => u.id === userId) as User;
    });
  }

  /**
   * Adds selected users to the current channel.
   * Handles errors encountered during the addition process.
   * Closes the dialog after users are added.
   * @returns Promise<void>
   */
  async addUsersToChannel(): Promise<void> {
    for (const userId of this.selectedUsers) {
      const user = this.findUserById(userId);
      if (user) {
        const minimalUser = this.createMinimalUser(user);
        try {
          await this.addUserToChannel(this.data.channelId, minimalUser);
          await this.addChannelToUser(user.id, this.data.channelId);
        } catch (error) {
          console.error('Error adding user to channel:', error);
        }
      }
    }
    this.dialogRef.close();
  }

  /**
   * Finds a user object by ID from the list of all users.
   * @param userId - ID of the user to find
   * @returns User object if found, otherwise undefined
   */
  findUserById(userId: string): User | undefined {
    return this.allUsers.find(u => u.id === userId);
  }

  /**
   * Creates a minimal representation of a user object containing only essential properties.
   * @param user - User object to create a minimal representation for
   * @returns MinimalUser object representing the user
   */
  createMinimalUser(user: User): MinimalUser {
    return {
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      email: user.email
    };
  }

  /**
   * Asynchronously adds a user to the specified channel.
   * @param channelId - ID of the channel to add the user to
   * @param minimalUser - Minimal representation of the user to add
   * @returns Promise<void>
   */
  async addUserToChannel(channelId: string, minimalUser: MinimalUser): Promise<void> {
    await this.channelsService.addSingleUserToChannel(channelId, minimalUser);
  }

  /**
   * Asynchronously adds the current channel to the specified user.
   * @param userId - ID of the user to add the channel to
   * @param channelId - ID of the channel to add to the user
   * @returns Promise<void>
   */
  async addChannelToUser(userId: string, channelId: string): Promise<void> {
    const channel = await this.channelsService.getChannelById(channelId);
    if (channel) {
      await this.userService.addChannelToSingleUser(userId, {
        id: channel.id,
        name: channel.name
      });
    }
  }

  /**
   * Closes the dialog without taking any further action.
   */
  onNoClick(): void {
    this.dialogRef.close();
  }

  /**
   * Cleans up subscriptions when the component is destroyed.
   */
  ngOnDestroy(): void {
    if (this.allUsersSubscription) {
      this.allUsersSubscription.unsubscribe();
    }
  }
}