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
import { Router, RouterModule } from '@angular/router';
import { RegistrationService } from '../../services/registration.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  router = inject(Router);
  registrationService = inject(RegistrationService);

  form: FormGroup = new FormGroup({
    name: new FormControl(''),
    email: new FormControl(''),
    password: new FormControl(''),
    acceptTerms: new FormControl(false),
  });
  submitted = false;

  constructor(private formBuilder: FormBuilder) {}

  ngOnInit(): void {
    const userData = this.registrationService.getUserData()
    console.log(userData);
    
    this.form = this.formBuilder.group({
      name: [
        this.registrationService.getName() || '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(20),
        ],
      ],
      email: [
        this.registrationService.getEmail() || '',
        [Validators.required, Validators.email],
      ],
      password: [
        this.registrationService.getPassword() || '',
        [
          Validators.required,
          Validators.minLength(6),
          Validators.maxLength(40),
        ],
      ],
      acceptTerms: [false, Validators.requiredTrue],
    });
  }

  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.form.invalid) {
      return;
    }

    this.registrationService.setName(this.form.value.name);
    this.registrationService.setEmail(this.form.value.email);
    this.registrationService.setPassword(this.form.value.password);
    this.router.navigate(['/chooseAvatar']);
  }
}
