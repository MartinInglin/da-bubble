import { Component, OnDestroy, OnInit, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { UserMenuComponent } from '../../../user-menu/user-menu.component';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { UsersService } from '../../../../../services/firestore/users.service';
import { AuthService } from '../../../../../services/auth.service';
import { User } from '../../../../../models/user.class';
import { Subscription } from 'rxjs';
import { SnackbarService } from '../../../../../services/snackbar.service';
import { StorageService } from '../../../../../services/storage.service';

@Component({
  selector: 'app-edit-current-user-mobile',
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
  templateUrl: './edit-current-user-mobile.component.html',
  styleUrl: './edit-current-user-mobile.component.scss'
})
export class EditCurrentUserMobileComponent implements OnInit, OnDestroy {
  storageService = inject(StorageService);

  @ViewChild('fileInput') fileInput!: ElementRef;

  private userSubscription: Subscription = new Subscription();
  private originalEmail: string = '';

  wantChangeMail: boolean = false;
  wantChangePassword: boolean = false;
  passwordIsFalse: boolean = false;
  isPasswordVerified: boolean = false;
  changeAvatar: boolean = false;

  currentUser: User | null = null;
  imagePreviewUrl: string | null = null;

  updatedName: string = '';
  updatedEmail: string = '';
  password: string = '';
  newPassword: string = '';
  selectedAvatar: string = '';
  availableAvatars: string[] = [
    'assets/images/avatars/avatar_1.svg',
    'assets/images/avatars/avatar_2.svg',
    'assets/images/avatars/avatar_3.svg',
    'assets/images/avatars/avatar_4.svg',
    'assets/images/avatars/avatar_5.svg',
    'assets/images/avatars/avatar_6.svg'
  ];
  file: File = new File([], '');

  readonly maxFileSize = 5 * 1024 * 1024;

  constructor(
    private usersService: UsersService,
    private authService: AuthService,
    private snackbarService: SnackbarService,
    public dialogRef: MatDialogRef<EditCurrentUserMobileComponent>
  ) { }

  /**
 * Lifecycle hook that is called after data-bound properties of a directive are initialized.
 * Initializes the user subscription to get the current user and update user details.
 */
  ngOnInit(): void {
    this.userSubscription = this.usersService.currentUser$.subscribe((user) => {
      this.currentUser = user;
      if (user) {
        this.updatedName = user.name;
        this.updatedEmail = user.email;
        this.originalEmail = user.email;
        this.selectedAvatar = user.avatar;
      }
    });
  }
  
  /**
   * Toggles the wantChangePassword flag to show/hide password change options.
   */
  wantToChangePassword(): void {
    this.wantChangePassword = !this.wantChangePassword;
  }
  
  /**
   * Selects a new avatar by setting the selectedAvatar and resetting the image preview URL.
   * @param {string} imageURLAvatar - The URL of the selected avatar image.
   */
  selectAvatar(imageURLAvatar: string): void {
    this.imagePreviewUrl = null;
    this.selectedAvatar = imageURLAvatar;
  }
  
  /**
   * Opens the file dialog for selecting an avatar image.
   */
  openFileDialog(): void {
    this.fileInput.nativeElement.click();
  }
  
  /**
   * Handles the file selection event and processes the selected file.
   * @param {Event} event - The file selection event.
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.file = input.files[0];
      this.handleFileSelection();
    }
  }
  
  /**
   * Handles the file selection by validating the file type and size, then displaying the image preview.
   */
  handleFileSelection(): void {
    if (this.isValidFileType()) {
      if (this.isFileSizeValid()) {
        this.displayImagePreview();
      } else {
        this.showFileSizeError();
      }
    } else {
      this.showFileTypeError();
    }
  }
  
  /**
   * Validates if the selected file is of a valid image type.
   * @returns {boolean} True if the file is a valid image type, otherwise false.
   */
  isValidFileType(): boolean {
    return this.file.type === 'image/jpeg' || this.file.type === 'image/png';
  }
  
  /**
   * Validates if the selected file size is within the allowed limit.
   * @returns {boolean} True if the file size is valid, otherwise false.
   */
  isFileSizeValid(): boolean {
    return this.file.size <= this.maxFileSize;
  }
  
  /**
   * Displays an error message when the selected file size exceeds the allowed limit.
   */
  showFileSizeError(): void {
    this.snackbarService.openSnackBar(
      'Die Datei ist zu groß. Bitte wähle eine Datei, die kleiner als 5 MB ist.',
      'Schließen'
    );
  }
  
  /**
   * Displays an error message when the selected file type is invalid.
   */
  showFileTypeError(): void {
    this.snackbarService.openSnackBar(
      'Bitte wähle ein Dateiformat jpg oder png.',
      'Schliessen'
    );
  }
  
  /**
   * Displays a preview of the selected image file.
   */
  displayImagePreview(): void {
    if (this.file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreviewUrl = e.target.result;
        this.selectedAvatar = e.target.result;
      };
      reader.readAsDataURL(this.file);
    }
  }
  
  /**
   * Saves the changes made to the user profile including name, email, and avatar.
   * @returns {Promise<void>}
   */
  async saveChanges(): Promise<void> {
    if (!this.currentUser) {
      console.error('Current user is not defined');
      return;
    }
    this.checkEmailChange();
    if (this.wantChangeMail && !this.isPasswordVerified) {
      return;
    }
    // Lösche den alten Avatar nur, wenn eine neue Datei ausgewählt wurde.
    if (this.isImageFile()) {
      await this.deleteOldAvatar();
      await this.saveNewAvatar();
    }
    await this.updateUserData();
    this.dialogRef.close();
  }
  
  /**
   * Checks if the email has been changed and sets the wantChangeMail flag accordingly.
   */
  checkEmailChange(): void {
    if (!this.currentUser) {
      console.error('Current user is not defined');
      return;
    }
  
    if (this.currentUser.email !== this.updatedEmail) {
      this.wantChangeMail = true;
    }
  }
  
  /**
   * Deletes the old avatar from storage.
   * @returns {Promise<void>}
   */
  async deleteOldAvatar(): Promise<void> {
    if (!this.currentUser || !this.currentUser.avatar) {
      console.error('Current user or avatar is not defined');
      return;
    }
  
    await this.storageService.deleteOldFile(this.currentUser.avatar);
  }
  
  /**
   * Checks if the selected file is a valid image type.
   * @returns {boolean} True if the file is a valid image type, otherwise false.
   */
  isImageFile(): boolean {
    return this.file && (this.file.type === 'image/jpeg' || this.file.type === 'image/png');
  }
  
  /**
   * Saves the new avatar image to storage.
   * @returns {Promise<void>}
   */
  async saveNewAvatar(): Promise<void> {
    if (!this.file) {
      console.error('File is not defined');
      return;
    }
  
    this.selectedAvatar = await this.storageService.saveImageUser(this.file);
  }
  
  /**
   * Updates the user data with the new profile information.
   * @returns {Promise<void>}
   */
  async updateUserData(): Promise<void> {
    if (!this.currentUser) {
      console.error('Current user is not defined');
      return;
    }
  
    const updatedData = {
      name: this.updatedName,
      email: this.wantChangeMail ? this.updatedEmail : this.currentUser.email,
      avatar: this.selectedAvatar,
    };
  
    await this.usersService.updateUser(this.currentUser, updatedData);
  }
  
  /**
   * Changes the email address of the current user after verifying the password.
   * @returns {Promise<void>}
   */
  async changeMailAdress(): Promise<void> {
    if (this.currentUser && this.password) {
      const isValid = await this.authService.verifyPassword(
        this.currentUser.email,
        this.password
      );
      this.isPasswordVerified = isValid;
      if (isValid) {
        await this.saveChanges();
        this.authService.changeEmail(this.updatedEmail, this.password);
      } else {
        this.passwordIsFalse = true;
      }
    }
  }
  
  /**
   * Changes the password of the current user after verifying the current password.
   * @returns {Promise<void>}
   */
  async changePassword(): Promise<void> {
    if (this.canChangePassword()) {
      const isValid = await this.verifyCurrentPassword();
      if (isValid) {
        await this.updatePassword();
        this.resetPasswordFields();
      } else {
        this.handleInvalidPassword();
      }
    }
  }
  
  /**
   * Checks if the current user, password, and new password are defined.
   * @returns {boolean} True if all required fields are defined, otherwise false.
   */
  canChangePassword(): boolean {
    return !!this.currentUser && !!this.password && !!this.newPassword;
  }
  
  /**
   * Verifies the current password of the user.
   * @returns {Promise<boolean>} True if the password is valid, otherwise false.
   */
  async verifyCurrentPassword(): Promise<boolean> {
    if (!this.currentUser || !this.currentUser.email || !this.password) {
      return false;
    }
    return await this.authService.verifyPassword(this.currentUser.email, this.password);
  }
  
  /**
   * Updates the password of the current user.
   * @returns {Promise<void>}
   */
  async updatePassword(): Promise<void> {
    if (!this.newPassword) {
      throw new Error('New password is required');
    }
    await this.authService.changePassword(this.newPassword);
    this.snackbarService.openSnackBar('Passwort erfolgreich geändert.', 'Schließen');
  }
  
  /**
   * Resets the password fields and toggles the wantChangePassword flag.
   */
  resetPasswordFields(): void {
    this.wantChangePassword = false;
    this.password = '';
    this.newPassword = '';
  }
  
  /**
   * Handles the scenario when the current password verification fails.
   */
  handleInvalidPassword(): void {
    this.passwordIsFalse = true;
    this.snackbarService.openSnackBar('Das alte Passwort ist falsch.', 'Schließen');
  }
  
  /**
   * Validates the updated email address format.
   * @returns {boolean} True if the email format is valid, otherwise false.
   */
  isValidEmail(): boolean {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(this.updatedEmail);
  }
  
  /**
   * Cancels the email change process and resets the email to the original value.
   */
  cancelChanges(): void {
    this.wantChangeMail = false;
    this.updatedEmail = this.originalEmail;
  }
  
  /**
   * Lifecycle hook that is called when the directive is destroyed.
   * Unsubscribes from the user subscription.
   */
  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }
  
  /**
   * Closes the dialog if the email change process is not ongoing.
   */
  onNoClick(): void {
    if (!this.wantChangeMail) {
      this.dialogRef.close();
    }
  }
  }
