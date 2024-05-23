import { Component} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { UserMenuComponent } from '../../user-menu/user-menu.component';
import { MatDialogRef } from '@angular/material/dialog';
import { UsersService } from '../../../services/firestore/users.service';
import { User } from '../../../models/user.class';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-edit-current-user',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    UserMenuComponent
  ],
  templateUrl: './edit-current-user.component.html',
  styleUrl: './edit-current-user.component.scss'
})
export class EditCurrentUserComponent {
  private userSubscription: Subscription = new Subscription();
  
  currentUser: User | null = null;

  constructor(
    private usersService: UsersService,
    public dialogRef: MatDialogRef<EditCurrentUserComponent>
  ) {}

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

  onNoClick(): void {
    this.dialogRef.close();
  }
}
