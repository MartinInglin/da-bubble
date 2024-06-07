import { Injectable, inject } from '@angular/core';
import { Firestore, doc, getDoc, updateDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class PostsService {
  firestore = inject(Firestore);

  constructor() {}

  async deleteFile(indexPost: number, documentId: string, path: string, indexFile: number) {
    try {
      const docRef = doc(this.firestore, path, documentId);
      const directMessageDoc = await getDoc(docRef);
      const directMessageData = directMessageDoc.data();
    
      if (directMessageData && directMessageData['posts']) {
        if (indexPost >= 0 && indexPost < directMessageData['posts'].length) {
          const post = directMessageData['posts'][indexPost];
          if (post.files && indexFile >= 0 && indexFile < post.files.length) {
            post.files.splice(indexFile, 1);
            await updateDoc(docRef, { posts: directMessageData['posts'] });
            console.log(`File at index ${indexFile} in post at index ${indexPost} deleted successfully.`);
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
}
