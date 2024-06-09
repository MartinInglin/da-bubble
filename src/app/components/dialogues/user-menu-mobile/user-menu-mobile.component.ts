import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { CurrentUserMobileComponent } from '../current-user-mobile/current-user-mobile.component';
import {
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/user.class';

@Component({
  selector: 'app-user-menu-mobile',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatDialogModule],
  templateUrl: './user-menu-mobile.component.html',
  styleUrl: './user-menu-mobile.component.scss'
})
export class UserMenuMobileComponent {
  authService = inject(AuthService);
  currentUser: User = new User();

  constructor(
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<UserMenuMobileComponent>
  ) { }

  onNoClick(): void {
    this.dialogRef.close();
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(CurrentUserMobileComponent, {
      width: '500px',
    });
  }

  signOUt() {
    this.authService.signOut(this.currentUser.id);
  }
}
