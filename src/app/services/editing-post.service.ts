import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EditingStateService {
  private editingPostIndex: number = -1;

  constructor() { }

  getEditingPostIndex(): number {
    return this.editingPostIndex;
  }

  setEditingPostIndex(index: number): void {
    this.editingPostIndex = index;
  }

  isPostBeingEdited(index: number): boolean {
    return this.editingPostIndex === index;
  }

  clearEditingPostIndex(): void {
    this.editingPostIndex = -1;
  }
}
