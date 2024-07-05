import { Component, inject, Inject, Sanitizer } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SafePipe } from '../../../pipes/safe-pipe.pipe';

@Component({
  selector: 'app-display-image',
  standalone: true,
  imports: [MatCardModule, SafePipe],
  templateUrl: './display-image.component.html',
  styleUrl: './display-image.component.scss',
})
export class DisplayImageComponent {
  [x: string]: Object;

  fileUrl: string;
  isPdf: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<DisplayImageComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { fileUrl: string; isPdf: boolean }
  ) {
    this.fileUrl = data.fileUrl;
    this.isPdf = data.isPdf;
  }

  /**
   * Closes the dialog.
   */
  onNoClick(): void {
    this.dialogRef.close();
  }
}
