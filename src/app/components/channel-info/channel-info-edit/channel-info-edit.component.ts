import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-channel-info-edit',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './channel-info-edit.component.html',
  styleUrl: './channel-info-edit.component.scss'
})
export class ChannelInfoEditComponent {

constructor(public dialogRef: MatDialogRef<ChannelInfoEditComponent>) {}

onNoClick(): void {
  this.dialogRef.close();
}
}
