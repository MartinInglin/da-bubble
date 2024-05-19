


import { Component, inject } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { RouterModule } from '@angular/router';
import { FirebaseService } from '../../../services/firebase.service';
import { User } from '../../../models/user.class';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-header',
  standalone: true,
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  authService = inject(AuthService);
  firebaseService = inject(FirebaseService);

  private userSubscription: Subscription = new Subscription;
  currentUser: User =  new User();

  ngOnInit(): void {
    this. userSubscription = this.firebaseService.currentUser$.subscribe((user) => {
      if (user) {
        this.currentUser = user;
      }
      console.log('Current User:', this.currentUser);
    });
  }

  search() {}

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }
}
