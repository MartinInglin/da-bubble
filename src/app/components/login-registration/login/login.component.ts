import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { StartAnimationComponent } from '../start-animation/start-animation.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    MatButtonModule,
    RouterModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    StartAnimationComponent,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  authService = inject(AuthService);
  form: FormGroup = new FormGroup({
    email: new FormControl(''),
    password: new FormControl(''),
  });

  submitted = false;
  animationFinished: boolean = false;

  constructor(private formBuilder: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });

    this.getStatusStartAnimationFromSessionStorage();
  }

  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.form.invalid) {
      return;
    }

    this.authService.signInWithEmail(
      this.form.value.email,
      this.form.value.password
    );
  }

  signInByGoogle() {
    this.authService.signInByGoogle();
  }

  setAnimationFinishedTrue(): void {
    this.animationFinished = true;
    this.setStatusStartAnimationToSessionStorage();
  }

  setStatusStartAnimationToSessionStorage() {
    sessionStorage.setItem('startAnimationHasPlayed', 'true');
  }

  getStatusStartAnimationFromSessionStorage() {
    const returnSessionStorage = sessionStorage.getItem(
      'startAnimationHasPlayed'
    );
    if (returnSessionStorage === 'true') {
      this.animationFinished = true;
    }
  }
}
