import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EditingStateService {
 /**
   * The index of the post that is currently being edited. 
   * Default is -1, which means no post is being edited.
   * @private
   */
 private editingPostIndex: number = -1;

 constructor() { }

 /**
  * Gets the index of the post that is currently being edited.
  * 
  * @returns {number} The index of the post being edited, or -1 if no post is being edited.
  */
 getEditingPostIndex(): number {
   return this.editingPostIndex;
 }

 /**
  * Sets the index of the post that is currently being edited.
  * 
  * @param {number} index - The index of the post to set as being edited.
  * @returns {void}
  */
 setEditingPostIndex(index: number): void {
   this.editingPostIndex = index;
 }

 /**
  * Checks if the specified post is being edited.
  * 
  * @param {number} index - The index of the post to check.
  * @returns {boolean} True if the specified post is being edited, false otherwise.
  */
 isPostBeingEdited(index: number): boolean {
   return this.editingPostIndex === index;
 }

 /**
  * Clears the index of the post that is currently being edited.
  * 
  * @returns {void}
  */
 clearEditingPostIndex(): void {
   this.editingPostIndex = -1;
 }
}
