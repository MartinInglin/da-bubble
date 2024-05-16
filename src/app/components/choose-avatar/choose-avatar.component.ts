import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-choose-avatar',
  standalone: true,
  imports: [RouterModule, ReactiveFormsModule],
  templateUrl: './choose-avatar.component.html',
  styleUrl: './choose-avatar.component.scss',
})
export class ChooseAvatarComponent {
  form: FormGroup = new FormGroup({
    avatar: new FormControl(''),
  });
  submitted = false;

  constructor(private formBuilder: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      avatar: [''],
    });
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.form.invalid) {
      return;
    }

    console.log(JSON.stringify(this.form.value, null, 2));
  }
}
