import { Component } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { merge } from 'rxjs';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  email = new FormControl('', [Validators.required, Validators.email]);
  password = new FormControl('', [Validators.required]);
  errorMessage = '';

  constructor() {
    merge(this.email.statusChanges, this.email.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.updateErrorMessageEmail());

    merge(this.password.statusChanges, this.password.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.updateErrorMessagePassword());
  }

  updateErrorMessageEmail() {
    if (this.email.hasError('required')) {
      this.errorMessage = 'Bitte geben Sie eine E-Mail-Adresse ein.';
    } else if (this.email.hasError('email')) {
      this.errorMessage = 'Diese E-Mail-Adresse ist nicht gültig.';
    } else {
      this.errorMessage = '';
    }
  }

  updateErrorMessagePassword() {
    if (this.password.hasError('required')) {
      this.errorMessage = 'Bitte geben Sie ihr Passwort ein.';
    }
  }

  onSubmit() {
    console.log('Form submitted');
  }
}
