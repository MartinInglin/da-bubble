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

  /**
   * This function calls the sign in function from the authservice.
   * 
   * @returns is form is invalid
   */
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

  /**
   * This form starts the sign in process if the user signs in with his google account.
   */
  signInByGoogle() {
    this.authService.signInByGoogle();
  }

  /**
   * This function sets the variable animation to true.
   */
  setAnimationFinishedTrue(): void {
    this.animationFinished = true;
    this.setStatusStartAnimationToSessionStorage();
  }

  /**
   * This function stores the variable startAnimationHasPlayed in the session storage. It is needed so the animation only plays the first time the user arrives on the page.
   */
  setStatusStartAnimationToSessionStorage() {
    sessionStorage.setItem('startAnimationHasPlayed', 'true');
  }

  /**
   * This function gets the variable startAnimationHasPlayed from the sesssion storage. It is needed so the animation only plays the first time the user arrives on the page. 
   */
  getStatusStartAnimationFromSessionStorage() {
    const returnSessionStorage = sessionStorage.getItem(
      'startAnimationHasPlayed'
    );
    if (returnSessionStorage === 'true') {
      this.animationFinished = true;
    }
  }
}
