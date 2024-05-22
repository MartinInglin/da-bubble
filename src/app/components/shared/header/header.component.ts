import { Component, inject } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { RouterModule } from '@angular/router';
import { User } from '../../../models/user.class';
import { Subscription } from 'rxjs';
import { UsersService } from '../../../services/firestore/users.service';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { UserMenuComponent } from '../../user-menu/user-menu.component';



@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    RouterModule,
    MatDialogModule,
    UserMenuComponent,
    MatCardModule,
    MatButtonModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  constructor(private dialog: MatDialog) {}

  authService = inject(AuthService);
  usersService = inject(UsersService);

  private userSubscription: Subscription = new Subscription;
  currentUser: User =  new User();
  dialogRef: MatDialogRef<UserMenuComponent> | null = null;

  ngOnInit(): void {
    this. userSubscription = this.usersService.currentUser$.subscribe((user) => {
      if (user) {
        this.currentUser = user;
      }
    });
  }

  search() {}

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(UserMenuComponent, {
      width: '282px',
      position: {
        top: '100px',
        right: '50px'
      },
    });
  }
}
