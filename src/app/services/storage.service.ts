import { Injectable, inject } from '@angular/core';
import {
  deleteObject,
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
} from '@angular/fire/storage';
import { MinimalFile } from '../interfaces/minimal_file';
import { SnackbarService } from './snackbar.service';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  snackbarService = inject(SnackbarService);
  private storage = getStorage();

  constructor() {}

  /**
   * This function saves a file a user adds to a post.
   *
   * @param postId string
   * @param files array of files
   * @returns data to be stored
   */
  async saveFiles(postId: string, files: File[]): Promise<MinimalFile[]> {
    this.checkTotalFileSize(files, 5);

    const uploadPromises = files.map((file) => this.uploadFile(postId, file));

    return Promise.all(uploadPromises);
  }

  /**
   * THis function checks if the size of the uploaded files do not exceed 5MB.
   *
   * @param files array of files
   * @param maxSizeMB number
   */
  checkTotalFileSize(files: File[], maxSizeMB: number): void {
    const MAX_TOTAL_FILE_SIZE_BYTES = maxSizeMB * 1024 * 1024;
    const totalSize = files.reduce((acc, file) => acc + file.size, 0);

    if (totalSize > MAX_TOTAL_FILE_SIZE_BYTES) {
      this.snackbarService.openSnackBar(
        `Die Dateien sind zu groß. Du kannst maximal ${maxSizeMB}MB speichern.`,
        'Schließen'
      );
      throw new Error(`Total size of all files exceeds ${maxSizeMB}MB.`);
    }
  }

  /**
   * This function uploads the file to firebase storage.
   *
   * @param postId string
   * @param file object of type fiel
   * @returns minimal file with name and download URL
   */
  async uploadFile(postId: string, file: File): Promise<MinimalFile> {
    this.checkFileType(file);

    const fileRef = ref(this.storage, `posts/${postId}/${file.name}`);
    const uploadTask = await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(uploadTask.ref);

    return {
      name: file.name,
      url: downloadURL,
    } as MinimalFile;
  }

  /**
   * This function checks if the type of the uploaded files are jpep or png.
   *
   * @param file object of type file
   */
  checkFileType(file: File): void {
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      this.snackbarService.openSnackBar(
        'Bitte wähle eine Datei im Format jpg oder png.',
        'Schliessen'
      );
      throw new Error('Invalid file type. Only jpg and png are allowed.');
    }
  }

  /**
   * This function deletes a file from storage.
   *
   * @param postId string
   * @param fileName string
   */
  async deleteFile(postId: string, fileName: string) {
    const fileRef = ref(this.storage, `posts/${postId}/${fileName}`);
    try {
      await deleteObject(fileRef);
    } catch (error) {
      console.error('An error occurred while deleting the file:', error);
    }
  }

  /**
   * This function saves the image of a user on firebase storage.
   *
   * @param file object of type file
   * @returns download URL as string
   */
  async saveImageUser(file: File): Promise<string> {
    const fileRef = ref(this.storage, `imagesUsers/${file.name}`);
    const uploadTask = await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(uploadTask.ref);

    return downloadURL;
  }

  /**
   * This function deletes the old file if the user stores a new profile image.
   *
   * @param fileURL string
   */
  async deleteOldFile(fileURL: string) {
    const fileName = this.getFileNameFromURL(fileURL);

    if (fileName !== '') {
      this.deleteImageUser(fileName);
    }
  }

  /**
   * This function extracts the name of the profile image from its URL.
   *
   * @param fileURL string
   * @returns name of the file as string
   */
  getFileNameFromURL(fileURL: string): string {
    try {
      new URL(fileURL);
    } catch {
      return '';
    }
    const pathParts = new URL(fileURL).pathname.split('/');
    for (const part of pathParts) {
      const match = part.match(/^imagesUsers%2F(.+)/);
      if (match) {
        return match[1];
      }
    }
    return '';
  }

  /**
   * This function deletes the profile image on firebase storage.
   *
   * @param fileName string
   */
  async deleteImageUser(fileName: string) {
    const fileRef = ref(this.storage, `imagesUsers/${fileName}`);
    try {
      await deleteObject(fileRef);
    } catch (error) {
      console.error('Image not deleted in storage', error);
    }
  }

  /**
   * This function is copied from github. It gets the file from the firebase storage.
   *
   * @param downloadUrl string
   */
  async getFile(downloadUrl: string) {
    const xhr = new XMLHttpRequest();
    xhr.responseType = 'blob';
    xhr.onload = (event) => {
      const blob = xhr.response;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'downloaded-file';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 0);
    };
    xhr.open('GET', downloadUrl);
    xhr.send();
  }
}
