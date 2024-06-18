import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { UserMenuComponent } from '../user-menu/user-menu.component';
import { UsersService } from '../../../services/firestore/users.service';
import { User } from '../../../models/user.class';
import { Subscription } from 'rxjs';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { EditCurrentUserComponent } from './edit-current-user/edit-current-user.component';

@Component({
  selector: 'app-current-user',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    UserMenuComponent,
    MatDialogModule
  ],
  templateUrl: './current-user.component.html',
  styleUrls: ['./current-user.component.scss']
})

export class CurrentUserComponent implements OnInit {
  private userSubscription: Subscription = new Subscription();

  currentUser: User | null = null;

  constructor(
    private usersService: UsersService,
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<CurrentUserComponent>
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
    const dialogRef = this.dialog.open(EditCurrentUserComponent, {
      width: '500px',
      position: {
        top: '120px',
        right: '30px',
      },
    });
  }

  /**
   * Closes the dialog.
   */
  onNoClick(): void {
    this.dialogRef.close();
  }
}
