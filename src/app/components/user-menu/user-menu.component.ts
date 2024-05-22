import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { CurrentUserComponent } from '../current-user/current-user.component';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-user-menu',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatDialogModule],
  templateUrl: './user-menu.component.html',
  styleUrl: './user-menu.component.scss',
})
export class UserMenuComponent {
  authService = inject(AuthService);

  constructor(
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<UserMenuComponent>
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(CurrentUserComponent, {
      width: '500px',
      position: {
        top: '100px',
        right: '50px',
      },
    });
  }

  signOUt() {
    this.authService.signOut();
  }
}
