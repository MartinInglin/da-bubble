import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-display-image',
  standalone: true,
  imports: [
    MatCardModule
  ],
  templateUrl: './display-image.component.html',
  styleUrl: './display-image.component.scss'
})
export class DisplayImageComponent {


  constructor(
    public dialogRef: MatDialogRef<DisplayImageComponent>
  ) { }

  /**
 * Closes the dialog.
 */
  onNoClick(): void {
    this.dialogRef.close();
  }
}
