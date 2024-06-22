import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class SnackbarService {

  constructor(private snackBar: MatSnackBar) {}

  /**
   * This function opens a snackbar at the bottom of the page. The snachbar contains a message container and a button to close the snackbar. In any case the snackbar closes after 5 seconds.
   * 
   * @param message Message to display as string
   * @param action Text to display on the closing button.
   */
  openSnackBar(message: string, action: string): void {
    this.snackBar.open(message, action, {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  openSnackBarVerifyEmail(message: string, action: string, callback?: () => void): void {
    const snackBarRef = this.snackBar.open(message, action, {
      duration: 5000,
      panelClass: ['error-snackbar'],
    });

    if (callback) {
      snackBarRef.onAction().subscribe(() => {
        callback();
      });
    }
  }
}
