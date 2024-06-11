import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Post } from '../../../models/post.class';
import { StorageService } from '../../../services/storage.service';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { Channel } from '../../../models/channel.class';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PostsService } from '../../../services/firestore/posts.service';
import { SnackbarService } from '../../../services/snackbar.service';

@Component({
  selector: 'app-post',
  standalone: true,
  imports: [CommonModule, MatMenuModule, MatTooltipModule, FormsModule],
  templateUrl: './post.component.html',
  styleUrl: './post.component.scss',
})
export class PostComponent {
  storageService = inject(StorageService);
  postsService = inject(PostsService);
  snackbarService = inject(SnackbarService);

  showMenu: boolean = false;
  showReaction: boolean = false;
  reactionIndex: number = 0;
  showEditMessage: boolean = false;
  postFromCurrentUser: boolean = false;
  wantToEditMessage: boolean = false;

  @Input() post: Post = new Post();
  @Input() currentUserId: string = '';
  @Input() selectedChannel!: Channel;
  @Input() selectedDirectMessageId: string = '';
  @Input() selectedThreadId: string = '';
  @Input() indexPost!: number;
  @Input() path!: 'directMessages' | 'threads' | 'channels';

  @Output() openThread = new EventEmitter();

  constructor() {}

  ngOnInit() {
    this.checkIfPostFromCurrentUser();
  }

  checkIfPostFromCurrentUser() {
    if (this.currentUserId === this.post.userId) {
      this.postFromCurrentUser = true;
    }
  }

  formatDateTime(timestamp: number): string {
    const date = new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes} Uhr`;
  }

  downloadFile(downloadURL: string, e: Event) {
    this.storageService.getFile(downloadURL);
    e.stopPropagation();
  }

  async deleteFile(fileName: string, e: Event, indexFile: number) {
    if (this.path === 'directMessages') {
      const documentId = this.selectedDirectMessageId;
      this.deleteFileOnCollection(this.path, documentId, indexFile);
      e.stopPropagation();
    } else if (this.path === 'channels') {
      const documentId = this.selectedChannel.id;
      this.deleteFileOnCollection(this.path, documentId, indexFile);
      this.deleteFileOnCorrespondingThread(indexFile);
      e.stopPropagation();
    } else if (this.path === 'threads') {
      const documentId = this.selectedThreadId;
      this.deleteFileOnCollection(this.path, documentId, indexFile);
      this.deleteFileOnCorrespondingChannel(documentId, indexFile);
    }

    this.storageService.deleteFile(this.post.id, fileName);
    e.stopPropagation();
  }

  async deleteFileOnCorrespondingThread(indexFile: number) {
    try {
      this.path = 'threads';
      const documentId = this.post.id;
      this.indexPost = 0;
      const threadExists = await this.postsService.checkIfThreadExists(
        documentId
      );
      if (threadExists) {
        this.deleteFileOnCollection(this.path, documentId, indexFile);
      } else {
        console.log('Thread does not exist');
      }
    } catch (error) {
      console.log('Failed to delete file on corresponding thread', error);
    }
  }

  async deleteFileOnCorrespondingChannel(
    documentId: string,
    indexFile: number
  ) {
    try {
      this.path = 'channels';
      documentId = this.selectedChannel.id;
      this.indexPost = await this.postsService.getIndexPostInChannel(
        this.post.id,
        documentId
      );
      this.deleteFileOnCollection(this.path, documentId, indexFile);
    } catch (error) {
      console.log('Failed to delete file on corresponding channel', error);
    }
  }

  deleteFileOnCollection(path: string, documentId: string, indexFile: number) {
    const pathToDocument = `${path}/${documentId}`;
    this.postsService.deleteFile(this.indexPost, pathToDocument, indexFile);
  }

  toggleShowEditMessage() {
    this.showEditMessage = !this.showEditMessage;
    console.log(this.showEditMessage);
  }

  toggleWantToEditMessage() {
    this.wantToEditMessage = !this.wantToEditMessage;
    if (this.wantToEditMessage) {
      setTimeout(() => {
        const textarea = document.querySelector('textarea');
        if (textarea) {
          textarea.focus();
        }
      }, 0);
    }
    this.toggleShowEditMessage();
  }

  async saveEditedMessage() {
    try {
      if (this.isMessageEmpty()) {
        this.snackbarService.openSnackBar('Bitte Nachricht eingeben.', 'Schließen');
        return;
      }
  
      const { path, documentId } = this.getPathAndDocumentId();
  
      await this.updatePost(path, documentId);
  
      await this.updateCorrespondingEntries();
  
      this.wantToEditMessage = false;
    } catch (error) {
      console.error('Error saving message: ', error);
    }
  }
  
  isMessageEmpty(): boolean {
    return this.post.message.trim() === '';
  }
  
  getPathAndDocumentId(): { path: string, documentId: string } {
    let path = '';
    let documentId = '';
  
    if (this.path === 'channels') {
      path = 'channels';
      documentId = this.selectedChannel.id;
    } else if (this.path === 'directMessages') {
      path = 'directMessages';
      documentId = this.selectedDirectMessageId;
    } else if (this.path === 'threads') {
      path = 'threads';
      documentId = this.selectedThreadId;
    }
  
    return { path, documentId };
  }
  
  async updatePost(path: string, documentId: string): Promise<void> {
    await this.postsService.editPost(
      path,
      documentId,
      this.indexPost,
      this.post.message
    );
  }
  
  async updateCorrespondingEntries(): Promise<void> {
    if (this.path === 'channels') {
      await this.updateCorrespondingThread();
    } else if (this.path === 'threads') {
      await this.updateCorrespondingChannel();
    }
  }
  
  async updateCorrespondingThread(): Promise<void> {
    const threadExists = await this.postsService.checkIfThreadExists(this.post.id);
    if (threadExists) {
      await this.postsService.editPost(
        'threads',
        this.post.id,
        0,
        this.post.message
      );
    }
  }
  
  async updateCorrespondingChannel(): Promise<void> {
    const indexPostInChannel = await this.postsService.getIndexPostInChannel(
      this.post.id,
      this.selectedChannel.id
    );
    if (indexPostInChannel !== -1) {
      await this.postsService.editPost(
        'channels',
        this.selectedChannel.id,
        indexPostInChannel,
        this.post.message
      );
    }
  }
 
  sendOpenThreadToParent(post: Post) {
    this.openThread.emit(post);
  }
}

// try {
//   pathToDocument = `channels/${this.selectedChannel.id}/threads/${this.post.id}`;

//   if (threadExists) {
//     this.indexPost = 0;
//     this.postsService.deleteFile(
//       this.indexPost,
//       pathToDocument,
//       indexFile
//     );
//   } else {
//
//   }
// } catch (error) {
//   console.error('Error checking if thread exists:', error);
// }
// } else if (this.path === 'threads') {
// pathToDocument = `channels/${this.selectedChannel.id}/${this.path}/${this.selectedThreadId}`;
// this.postsService.deleteFile(this.indexPost, pathToDocument, indexFile);
// e.stopPropagation();

// if (this.indexPost == 0) {
//   ;
//   try {

//   } catch (error) {
//     console.error('Error setting indexPost:', error);
//   }
//   this.postsService.deleteFile(this.indexPost, pathToDocument, indexFile);
//   e.stopPropagation();
// }
