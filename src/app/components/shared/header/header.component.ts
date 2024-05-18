import { Component, inject } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { RouterModule } from '@angular/router';
import { FirebaseService } from '../../../services/firebase.service';
import { User } from '../../../models/user.class';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  authService = inject(AuthService);
  firebaseService = inject(FirebaseService);

  currentUser: User =  new User();

  ngOnInit(): void {
    this.firebaseService.currentUser$.subscribe((user) => {
      if (user) {
        this.currentUser = user;
      }
      console.log('Current User:', this.currentUser);
    });

    // Assuming you have the userId stored somewhere (e.g., after login)
    const userId = 'some-user-id';
    this.firebaseService.getCurrentUser(userId);
  }

  search() {}
}
