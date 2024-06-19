import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [MatButtonModule],
  templateUrl: './privacy-policy.component.html',
  styleUrl: './privacy-policy.component.scss',
})
export class PrivacyPolicyComponent {
  constructor(private location: Location) {}

  /**
   * This function navigates back to the page the user previously was.
   */
  back(): void {
    this.location.back();
  }
}
