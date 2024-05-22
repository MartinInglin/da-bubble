import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ProfileDetailViewComponent } from '../profile-detail-view/profile-detail-view.component';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';


@Component({
  selector: 'app-members',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './members.component.html',
  styleUrl: './members.component.scss'
})

export class MembersComponent {
  constructor(
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<MembersComponent>
  ) {}

  openDetailViewDialog(): void {
    const dialogRef = this.dialog.open(ProfileDetailViewComponent, {
      width: '500px',
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
