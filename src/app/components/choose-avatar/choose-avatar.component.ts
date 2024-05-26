import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RegistrationService } from '../../services/registration.service';
import { SnackbarService } from '../../services/snackbar.service';

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
  file: File = new File([], '');
  imagePreviewUrl: string | null = null;

  form: FormGroup = new FormGroup({
    avatar: new FormControl(''),
  });
  submitted = false;

  constructor(private formBuilder: FormBuilder) {}

  ngOnInit(): void {
    this.selectedAvatar =
      this.registrationService.getAvatar() ||
      'assets/images/avatars/profile.svg';

    this.form = this.formBuilder.group({
      avatar: [this.registrationService.getAvatar() || ''],
    });
  }

  setAvatar(imageURLAvatar: string) {
    this.imagePreviewUrl = null;
    this.selectedAvatar = imageURLAvatar;
    this.registrationService.setAvatar(imageURLAvatar);
  }

  openFileDialog() {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.file = input.files[0];
      if (this.file.type === 'image/jpeg' || this.file.type === 'image/png') {
        this.registrationService.setAvatarFile(this.file);
        this.displayImagePreview();
      } else {
        this.snackbarService.openSnackBar(
          'Bitte wähle ein Dateiformat jpg oder png.',
          'Schliessen'
        );
      }
    }
  }

  displayImagePreview() {
    if (this.file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreviewUrl = e.target.result;
      };
      reader.readAsDataURL(this.file);
    }
  }

  onSubmit(): void {
    this.submitted = true;
    this.authService.signUp();
  }
}
