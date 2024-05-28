import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-profile-detail-view',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './profile-detail-view.component.html',
  styleUrl: './profile-detail-view.component.scss'
})
export class ProfileDetailViewComponent {
  constructor(
    public dialogRef: MatDialogRef<ProfileDetailViewComponent>
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }
  
}