import { Injectable, inject } from '@angular/core';
import {
  deleteObject,
  getDownloadURL,
  getMetadata,
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

  async saveFiles(postId: string, files: File[]): Promise<MinimalFile[]> {
    const MAX_TOTAL_FILE_SIZE_MB = 5;
    const MAX_TOTAL_FILE_SIZE_BYTES = MAX_TOTAL_FILE_SIZE_MB * 1024 * 1024;
    const totalSize = files.reduce((acc, file) => acc + file.size, 0);

    if (totalSize > MAX_TOTAL_FILE_SIZE_BYTES) {
      this.snackbarService.openSnackBar(
        'Die Dateien sind zu groß. Du kannst maximal 5MB speichern.',
        'Schließen'
      );
      throw new Error('Total size of all files exceeds 5MB.');
    }

    const uploadPromises = files.map(async (file) => {
      const fileRef = ref(this.storage, `posts/${postId}/${file.name}`);
      const uploadTask = await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(uploadTask.ref);
      return {
        name: file.name,
        url: downloadURL,
      } as MinimalFile;
    });

    return Promise.all(uploadPromises);
  }

  async deleteFile(postId: string, fileName: string) {
    const fileRef = ref(this.storage, `posts/${postId}/${fileName}`);
    try {
      await deleteObject(fileRef);
    } catch (error) {
      console.error('An error occurred while deleting the file:', error);
    }
  }

  async saveImageUser(file: File): Promise<string> {
    const fileRef = ref(this.storage, `imagesUsers/${file.name}`);
    const uploadTask = await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(uploadTask.ref);

    return downloadURL;
  }

  async deleteOldFile(fileURL: string) {
    const fileName = this.getFileNameFromURL(fileURL);

    if (fileName !== '') {
      this.deleteImageUser(fileName);
    }
  }

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

  async deleteImageUser(fileName: string) {
    const fileRef = ref(this.storage, `imagesUsers/${fileName}`);
    try {
      await deleteObject(fileRef);
    } catch (error) {
      console.error('Image not deleted in storage', error);
    }
  }

  async getFile(downloadUrl: string) {
    const xhr = new XMLHttpRequest();
    xhr.responseType = 'blob';
    xhr.onload = (event) => {
      const blob = xhr.response;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'downloaded-file'; // You can set a default filename here
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
