import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

import { SnackbarService } from '../../../services/snackbar.service';
import { RegistrationService } from '../../../services/registration.service';

@Component({
  selector: 'app-choose-avatar',
  standalone: true,
  imports: [RouterModule, ReactiveFormsModule],
  templateUrl: './choose-avatar.component.html',
  styleUrl: './choose-avatar.component.scss',
})
export class ChooseAvatarComponent {
  authService = inject(AuthService);
  registrationService = inject(RegistrationService);
  snackbarService = inject(SnackbarService);

  @ViewChild('fileInput') fileInput!: ElementRef;

  selectedAvatar: string = '';
  userName: string = '';
  file: File = new File([], '');
  imagePreviewUrl: string | null = null;

  form: FormGroup = new FormGroup({
    avatar: new FormControl(''),
  });
  submitted = false;

  readonly maxFileSize = 5 * 1024 * 1024;

  constructor(private formBuilder: FormBuilder) {}

  ngOnInit(): void {
    this.getUserName();
  
    let storedAvatar = this.registrationService.getAvatar();
  
    if (!storedAvatar) {
      storedAvatar = 'assets/images/avatars/profile.svg';
      this.registrationService.setAvatar(storedAvatar);
    }
  
    this.selectedAvatar = storedAvatar;
  
    this.form = this.formBuilder.group({
      avatar: [storedAvatar],
    });
  }
  
/**
 * This function gets the user name from the registration service.
 */
  getUserName() {
    this.userName = this.registrationService.getName();
  }

  /**
   * This function stores the avatar URL in the registration service if the user uploads an individual image.
   * 
   * @param imageURLAvatar string
   */
  setAvatar(imageURLAvatar: string) {
    this.imagePreviewUrl = null;
    this.selectedAvatar = imageURLAvatar;
    this.registrationService.setAvatar(imageURLAvatar);
  }

  /**
   * This function opens the dialog to upload a file.
   */
  openFileDialog() {
    this.fileInput.nativeElement.click();
  }

  /**
   * This function checks if an uploaded file fits the required format and file size. If so it stores the image in the registration service and displays the image.
   * 
   * @param event change event if a file is selected
   */
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.file = input.files[0];
      if (this.file.type === 'image/jpeg' || this.file.type === 'image/png') {
        if (this.file.size <= this.maxFileSize) {
          this.registrationService.setAvatarFile(this.file);
          this.displayImagePreview();
        } else {
          this.snackbarService.openSnackBar(
            'Die Datei ist zu groß. Bitte wähle eine Datei, die kleiner als 5 MB ist.',
            'Schliessen'
          );
        }
      } else {
        this.snackbarService.openSnackBar(
          'Bitte wähle ein Dateiformat jpg oder png.',
          'Schliessen'
        );
      }
    }
  }

  /**
   * This function displays the image if the user uploads an individual image.
   */
  displayImagePreview() {
    if (this.file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreviewUrl = e.target.result;
      };
      reader.readAsDataURL(this.file);
    }
  }

  /**
   * This function starts the sign up process if the user hits the submit button.
   */
  onSubmit(): void {
    this.submitted = true;
    this.authService.signUp();
  }
}
