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

  ngOnInit(): void {
    const userSubscription = this.usersService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(EditCurrentUserMobileComponent, {
      width: '500px',
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
