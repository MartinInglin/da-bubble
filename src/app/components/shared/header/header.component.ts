


import { Component, inject } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { RouterModule } from '@angular/router';
import { User } from '../../../models/user.class';
import { Subscription } from 'rxjs';
import { UsersService } from '../../../services/firestore/users.service';


@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  authService = inject(AuthService);
  usersService = inject(UsersService);

  private userSubscription: Subscription = new Subscription;
  currentUser: User =  new User();

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
}
