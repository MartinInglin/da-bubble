import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { UsersService } from '../../services/firestore/users.service';
import { User } from '../../models/user.class';

@Component({
  selector: 'app-current-user',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './current-user.component.html',
  styleUrls: ['./current-user.component.scss']
})
export class CurrentUserComponent implements OnInit {
  currentUser: User | null = null;

  constructor(private usersService: UsersService) {}

  ngOnInit(): void {
    this.usersService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }
}
