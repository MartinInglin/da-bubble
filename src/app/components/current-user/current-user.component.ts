import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { UserMenuComponent } from '../user-menu/user-menu.component';
import { UsersService } from '../../services/firestore/users.service';
import { User } from '../../models/user.class';
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
    const dialogRef = this.dialog.open(EditCurrentUserComponent, {
      width: '500px',
      position: {
        top: '100px',
        right: '50px',
      },
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
