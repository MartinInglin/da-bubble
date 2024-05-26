import { Injectable } from '@angular/core';
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
} from '@angular/fire/storage';
import { MinimalFile } from '../interfaces/minimal_file';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private storage = getStorage();

  constructor() {}

  async saveFiles(postId: string, files: File[]): Promise<MinimalFile[]> {
    const uploadPromises = files.map(async (file) => {
      const fileRef = ref(this.storage, `posts/${postId}/${file.name}`);
      const uploadTask = await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(uploadTask.ref);
      return {
        name: file.name,
        url: downloadURL,
      } as MinimalFile;
    });

    // Wait for all upload promises to resolve
    return Promise.all(uploadPromises);
  }

  async saveImageUser(userId:string, file: File): Promise<string> {
    const fileRef = ref(this.storage, `imagesUsers/${file.name}`);
    const uploadTask = await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(uploadTask.ref);

    return downloadURL;
  }

  async getFile(downloadUrl: string) {
    const xhr = new XMLHttpRequest();
    xhr.responseType = 'blob';
    xhr.onload = (event) => {
      const blob = xhr.response;
    };
    xhr.open('GET', downloadUrl);
    xhr.send();
  }
}
