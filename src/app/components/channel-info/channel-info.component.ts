import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';



@Component({
  selector: 'app-channel-info',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './channel-info.component.html',
  styleUrl: './channel-info.component.scss'
})
export class ChannelInfoComponent {
  constructor(
    public dialogRef: MatDialogRef<ChannelInfoComponent>
  ) { }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
