import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { UserMenuComponent } from '../../user-menu/user-menu.component';
import { UsersService } from '../../../../services/firestore/users.service';
import { User } from '../../../../models/user.class';
import { Subscription } from 'rxjs';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { EditCurrentUserMobileComponent } from './edit-current-user-mobile/edit-current-user-mobile.component';

@Component({
  selector: 'app-current-user-mobile',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    UserMenuComponent,
    MatDialogModule
  ],
  templateUrl: './current-user-mobile.component.html',
  styleUrl: './current-user-mobile.component.scss'
})
export class CurrentUserMobileComponent {

  private userSubscription: Subscription = new Subscription();

  currentUser: User | null = null;

  constructor(
    private usersService: UsersService,
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<CurrentUserMobileComponent>
  ) { }

  /**
   * Lifecycle hook that is called after data-bound properties of a directive are initialized.
   * Subscribes to the currentUser$ observable to get the current user.
   */
  ngOnInit(): void {
    const userSubscription = this.usersService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  /**
   * Lifecycle hook that is called when the directive is destroyed.
   * Unsubscribes from the user subscription if it exists.
   */
  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  /**
   * Opens a dialog to edit the current user's information.
   */
  openDialog(): void {
    const dialogRef = this.dialog.open(EditCurrentUserMobileComponent, {
      width: '500px',
    });
  }

/**
* Extracts the first and last word of a given name.
* @param {string} name - The full name of the user.
* @returns {string} - The processed name containing only the first and last word.
*/
  getFirstAndLastName(name: string): string {
    const words = name.split(' ');
    if (words.length > 1) {
      return `${words[0]} ${words[words.length - 1]}`;
    }
    return name;
  }

  /**
   * Closes the dialog.
   */
  onNoClick(): void {
    this.dialogRef.close();
  }
}
