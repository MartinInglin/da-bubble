import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RegistrationService } from '../../services/registration.service';

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

  selectedAvatar: string = '';

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

  onSubmit(): void {
    this.submitted = true;
    this.authService.signUp();
  }

  setAvatar(imageURLAvatar: string) {
    this.selectedAvatar = imageURLAvatar;
    this.registrationService.setAvatar(imageURLAvatar);
  }
}
