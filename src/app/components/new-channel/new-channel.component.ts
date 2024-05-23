import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { AddUserToNewChannelComponent } from '../add-user-to-new-channel/add-user-to-new-channel.component';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-new-channel',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    FormsModule,
    MatDialogModule
  ],
  templateUrl: './new-channel.component.html',
  styleUrl: './new-channel.component.scss'
})
export class NewChannelComponent {
  constructor(
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<NewChannelComponent>
  ) {}

  openDialog(): void {
    const dialogRef = this.dialog.open(AddUserToNewChannelComponent, {
      width: '710px'
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
