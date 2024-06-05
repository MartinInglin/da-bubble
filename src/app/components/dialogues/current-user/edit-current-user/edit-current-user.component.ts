import { Component, OnDestroy, OnInit, ElementRef, ViewChild } from '@angular/core';
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
import { SnackbarService } from '../../../../services/snackbar.service';

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
  changeAvatar: boolean = false;

  availableAvatars: string[] = [
    'assets/images/avatars/avatar_1.svg',
    'assets/images/avatars/avatar_2.svg',
    'assets/images/avatars/avatar_3.svg',
    'assets/images/avatars/avatar_4.svg',
    'assets/images/avatars/avatar_5.svg',
    'assets/images/avatars/avatar_6.svg'
  ];
  selectedAvatar: string = '';
  file: File = new File([], '');
  imagePreviewUrl: string | null = null;

  @ViewChild('fileInput') fileInput!: ElementRef;

  readonly maxFileSize = 5 * 1024 * 1024;

  constructor(
    private usersService: UsersService,
    private authService: AuthService,
    private snackbarService: SnackbarService,
    public dialogRef: MatDialogRef<EditCurrentUserComponent>
  ) {}

  ngOnInit(): void {
    this.userSubscription = this.usersService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.updatedName = user.name;
        this.updatedEmail = user.email;
        this.originalEmail = user.email;
        this.selectedAvatar = user.avatar; // Set the default avatar to the current user's avatar
      }
    });
  }

  toggleAvatar(): void {
    this.changeAvatar = !this.changeAvatar;
  }

  selectAvatar(avatar: string): void {
    this.imagePreviewUrl = null;
    this.selectedAvatar = avatar;
  }

  openFileDialog() {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.file = input.files[0];
      if (this.file.type === 'image/jpeg' || this.file.type === 'image/png') {
        if (this.file.size <= this.maxFileSize) {
          this.displayImagePreview();
        } else {
          this.snackbarService.openSnackBar('Die Datei ist zu groß. Bitte wähle eine Datei, die kleiner als 5 MB ist.', 'Schließen');
        }
      } else {
        this.snackbarService.openSnackBar('Bitte wähle ein Dateiformat jpg oder png.', 'Schliessen');
      }
    }
  }

  displayImagePreview() {
    if (this.file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreviewUrl = e.target.result;
        this.selectedAvatar = e.target.result; // Use the uploaded image as the selected avatar
      };
      reader.readAsDataURL(this.file);
    }
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
        email: this.wantChangeMail ? this.updatedEmail : this.currentUser.email,
        avatar: this.selectedAvatar
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
