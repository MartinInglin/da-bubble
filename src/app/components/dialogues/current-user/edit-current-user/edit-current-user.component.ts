import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { UserMenuComponent } from '../../user-menu/user-menu.component';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { UsersService } from '../../../../services/firestore/users.service';
import { AuthService } from '../../../../services/auth.service';
import { User } from '../../../../models/user.class';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-edit-current-user',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    UserMenuComponent,
    FormsModule,
    MatDialogModule
  ],
  templateUrl: './edit-current-user.component.html',
  styleUrls: ['./edit-current-user.component.scss']
})
export class EditCurrentUserComponent implements OnInit, OnDestroy {
  
  private userSubscription: Subscription = new Subscription();
  private originalEmail: string = '';
  
  currentUser: User | null = null;
  updatedName: string = '';
  updatedEmail: string = '';
  wantChangeMail: boolean = false;
  password: string = '';
  passwordIsFalse: boolean = false;
  isPasswordVerified: boolean = false;

  constructor(
    private usersService: UsersService,
    private authService: AuthService,
    public dialogRef: MatDialogRef<EditCurrentUserComponent>
  ) {}

  ngOnInit(): void {
    this.userSubscription = this.usersService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.updatedName = user.name;
        this.updatedEmail = user.email;
        this.originalEmail = user.email;
      }
    });
  }

  async saveChanges(): Promise<void> {
    if (this.currentUser) {
      if (this.currentUser.email !== this.updatedEmail) {
        this.wantChangeMail = true;
      }

      if (this.wantChangeMail && !this.isPasswordVerified) {
        return;
      }

      const updatedData = {
        name: this.updatedName,
        email: this.wantChangeMail ? this.updatedEmail : this.currentUser.email
      };
      await this.usersService.updateUser(this.currentUser.id, updatedData);
      this.dialogRef.close();
    }
  }

  async changeMailAdress(): Promise<void> {
    if (this.currentUser && this.password) {
      const isValid = await this.authService.verifyPassword(this.currentUser.email, this.password);
      this.isPasswordVerified = isValid;
      if (isValid) {
        await this.saveChanges();
        this.authService.changeEmail(this.updatedEmail, this.password)
      } else {
        this.passwordIsFalse = true;
      }
    }
  }

  isValidEmail(): boolean {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(this.updatedEmail);
  }
  
  cancelChanges(): void {
    this.wantChangeMail = false;
    this.updatedEmail = this.originalEmail;
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  onNoClick(): void {
    if (!this.wantChangeMail) {
      this.dialogRef.close();
    }
  }
}
