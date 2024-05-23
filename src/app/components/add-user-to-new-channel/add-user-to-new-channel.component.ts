import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatRadioModule } from '@angular/material/radio';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-add-user-to-new-channel',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    FormsModule,
    MatRadioModule
  ],
  templateUrl: './add-user-to-new-channel.component.html',
  styleUrls: ['./add-user-to-new-channel.component.scss']
})
export class AddUserToNewChannelComponent {
  people: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<AddUserToNewChannelComponent>
  ) { }

  onNoClick(): void {
    this.dialogRef.close();
  }
}