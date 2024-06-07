import { Injectable, inject } from '@angular/core';
import { Firestore, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { Post } from '../../models/post.class';

@Injectable({
  providedIn: 'root',
})
export class PostsService {
  firestore = inject(Firestore);

  constructor() {}

  async deleteFile(
    indexPost: number,
    pathToDocument: string,
    indexFile: number
  ) {
    try {
      const docRef = doc(this.firestore, pathToDocument);
      const document = await getDoc(docRef);
      const documentData = document.data();
      if (documentData && documentData['posts']) {
        if (indexPost >= 0 && indexPost < documentData['posts'].length) {
          const post = documentData['posts'][indexPost];
          if (post.files && indexFile >= 0 && indexFile < post.files.length) {
            post.files.splice(indexFile, 1);
            await updateDoc(docRef, { posts: documentData['posts'] });
            console.log(
              `File at index ${indexFile} in post at index ${indexPost} deleted successfully.`
            );
          } else {
            console.error('Invalid indexFile: Index out of bounds.');
          }
        } else {
          console.error('Invalid indexPost: Index out of bounds.');
        }
      } else {
        console.error('No data found or posts array is missing.');
      }
    } catch (error) {
      console.error('Error deleting file: ', error);
    }
  }

  async getIndexPostInChannel(
    postId: string,
    pathToDocument: string
  ): Promise<number> {
    try {
      const docRef = doc(this.firestore, pathToDocument);
      const document = await getDoc(docRef);
      const documentData = document.data();

      if (documentData && documentData['posts']) {
        for (let i = 0; i < documentData['posts'].length; i++) {
          if (documentData['posts'][i].id === postId) {
            return i;
          }
        }
      }
      return -1;
    } catch (error) {
      console.error('Error getting index of channel', error);
      return -1;
    }
  }

  async checkIfThreadExists(
    pathToDocument: string,
  ): Promise<boolean> {
    try {
      const docRef = doc(this.firestore, pathToDocument);
      const document = await getDoc(docRef);

        if (document.exists()) {
          return true;
        }
  
      return false;
    } catch (error) {
      console.error('Error checking for thread data', error);
      return false;
    }
  }
}
