import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatRadioModule } from '@angular/material/radio';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UsersService } from '../../../services/firestore/users.service';
import { ChannelsService } from '../../../services/firestore/channels.service';
import { MinimalChannel } from '../../../models/minimal_channel.class';
import { Subscription } from 'rxjs';
import { User } from '../../../models/user.class';
import { MinimalUser } from '../../../models/minimal_user.class';

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
export class AddUserToNewChannelComponent implements OnDestroy, OnInit {
  peopleType: string = 'all';
  channelId: string = '';
  channelName: string = '';

  currentUser: User | null = null;
  selectedUser: User | null = null;

  allUsers: User[] = [];
  filteredUsers: User[] = [];
  selectedUsers: string[] = [];

  showResults: boolean = false;
  
  private allUsersSubscription: Subscription = new Subscription();
  private userSubscription: Subscription = new Subscription();

  constructor(
    public dialogRef: MatDialogRef<AddUserToNewChannelComponent>,
    private usersService: UsersService,
    public channelsService: ChannelsService,
    @Inject(MAT_DIALOG_DATA) public data: { channelId: string, channelName: string }
  ) {
    this.channelId = data.channelId;
    this.channelName = data.channelName;
  }

  /**
   * Initializes the component and subscribes to user and all users data streams.
   * Updates the filtered users list based on received data.
   */
  ngOnInit(): void {
    this.userSubscription = this.usersService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    this.allUsersSubscription = this.usersService.allUsersSubject$.subscribe(
      (allUsers) => {
        this.allUsers = allUsers ?? [];
        this.updateFilteredUsers();
      }
    );
  }

  /**
   * Adds all users to a channel if the people type is 'all'.
   * Closes the dialog after adding the users.
   */
  addAllUsersToChannel(): void {
    if (this.peopleType === 'all') {
      if (this.allUsers) {
        this.allUsers.forEach((user) => {
          const minimalChannel: MinimalChannel = {
            id: this.channelId,
            name: this.channelName,
          };
          this.usersService.addChannelToUsers(minimalChannel);
          this.channelsService.addAllUsersToChannel(this.channelId);
        });
      }
      this.dialogRef.close();
    }
  }

  /**
   * Handles search input changes, filtering users based on the search value.
   * @param {Event} event - The search input event.
   */
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

  /**
   * Toggles the selection of a user by their ID.
   * @param {string} userId - The ID of the user to select or deselect.
   */
  selectUser(userId: string): void {
    if (this.selectedUsers.includes(userId)) {
      this.selectedUsers = this.selectedUsers.filter(id => id !== userId);
    } else {
      this.selectedUsers.push(userId);
    }
    this.updateFilteredUsers();
  }

  /**
   * Checks if a user is selected by their ID.
   * @param {string} userId - The ID of the user to check.
   * @returns {boolean} - True if the user is selected, false otherwise.
   */
  isSelected(userId: string): boolean {
    return this.selectedUsers.includes(userId);
  }

  /**
   * Updates the filtered users list based on the current search value and selections.
   */
  updateFilteredUsers(): void {
    const searchValue = (document.querySelector('input[placeholder="Name eingeben"]') as HTMLInputElement)?.value;
    this.filteredUsers = this.allUsers.filter(user =>
      (!this.currentUser || user.id !== this.currentUser.id) &&
      !this.selectedUsers.includes(user.id) &&
      user.name.toLowerCase().includes(searchValue?.toLowerCase() || '')
    );
  }

  /**
   * Adds a single user to a channel and updates the user's channel list.
   * @param {User} user - The user to add to the channel.
   * @param {string} channelId - The ID of the channel.
   * @param {string} channelName - The name of the channel.
   * @returns {Promise<void>} - A promise that resolves when the user is added.
   */
  async addSingleUserToChannel(user: User, channelId: string, channelName: string): Promise<void> {
    const minimalUser: MinimalUser = {
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      email: user.email
    };
    try {
      await this.channelsService.addSingleUserToChannel(channelId, minimalUser);
      const channel = await this.channelsService.getChannelById(channelId);
      if (channel) {
        await this.usersService.addChannelToSingleUser(user.id, {
          id: channel.id,
          name: channel.name
        });
      }
    } catch (error) {
      console.error('Fehler beim Hinzufügen des Benutzers zum Kanal:', error);
    }
  }

  /**
   * Adds selected users to a channel if the people type is 'specific'.
   * Closes the dialog after adding the users.
   * @returns {Promise<void>} - A promise that resolves when the users are added.
   */
  async addUsersToChannel(): Promise<void> {
    if (this.peopleType === 'specific') {
      for (const userId of this.selectedUsers) {
        const user = this.allUsers.find(u => u.id === userId);
        if (user) {
          await this.addSingleUserToChannel(user, this.data.channelId, this.data.channelName);
        }
      }
      this.dialogRef.close();
    }
  }

  /**
   * Gets the list of selected users.
   * @returns {User[]} - The list of selected users.
   */
  getSelectedUsers(): User[] {
    return this.selectedUsers.map(userId => {
      return this.allUsers.find(u => u.id === userId) as User;
    });
  }

  /**
   * Submits the selected users to the channel based on the people type.
   */
  onSubmit(): void {
    if (this.peopleType === 'all') {
      this.addAllUsersToChannel();
    } else if (this.peopleType === 'specific') {
      this.addUsersToChannel();
    }
  }

  /**
   * Handles clicks outside the user list to hide search results.
   * @param {Event} event - The click event.
   */
  onOutsideClick(event: Event): void {
    if (!(event.target as HTMLElement).closest('.user-list')) {
      this.showResults = false;
    }
  }

  /**
   * Closes the dialog without making any changes.
   */
  onNoClick(): void {
    this.dialogRef.close();
  }

  /**
   * Unsubscribes from user and all users data streams to prevent memory leaks.
   */
  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    if (this.allUsersSubscription) {
      this.allUsersSubscription.unsubscribe();
    }
  }
}
