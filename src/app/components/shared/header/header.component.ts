import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
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
    MatButtonModule,
    CommonModule
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  constructor(private dialog: MatDialog, private router: Router) {}

  authService = inject(AuthService);
  usersService = inject(UsersService);

  private userSubscription: Subscription = new Subscription();
  private routeSubscription: Subscription = new Subscription();
  currentUser: User = new User();
  dialogRef: MatDialogRef<UserMenuComponent> | null = null;
  isDialogOpen = false;
  showRegisterElement = false;
  menuDown = './../../../../assets/images/icons/keyboard_arrow_down.svg';

  ngOnInit(): void {
    this.userSubscription = this.usersService.currentUser$.subscribe((user) => {
      if (user) {
        this.currentUser = user ?? new User();;
      }
    });

    this.routeSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.showRegisterElement = event.url === '/' || event.url === '/login';
      }
    });
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
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
    dialogRef.componentInstance.currentUser = new User(this.currentUser);

    this.isDialogOpen = true;

    dialogRef.afterClosed().subscribe(() => {
      this.isDialogOpen = false;
    });
  }

  onMouseOver(): void {
    this.menuDown = './../../../../assets/images/icons/keyboard_arrow_down_blue.svg';
  }

  onMouseOut(): void {
    this.menuDown = './../../../../assets/images/icons/keyboard_arrow_down.svg';
  }

  search(): void {}
}
