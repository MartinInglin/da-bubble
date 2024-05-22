import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ChannelInfoEditComponent } from './channel-info-edit/channel-info-edit.component';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';



@Component({
  selector: 'app-channel-info',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule
  ],
  templateUrl: './channel-info.component.html',
  styleUrl: './channel-info.component.scss'
})
export class ChannelInfoComponent {
  constructor(
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<ChannelInfoComponent>
  ) { }

  openDialog(): void {
    const dialogRef = this.dialog.open(ChannelInfoEditComponent, {
      width: '872px'
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
