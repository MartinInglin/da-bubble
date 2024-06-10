import { Component, EventEmitter, Input, Output, inject} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Post } from '../../../models/post.class';
import { StorageService } from '../../../services/storage.service';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { Channel } from '../../../models/channel.class';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PostsService } from '../../../services/firestore/posts.service';

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

  constructor() {
    this.checkIfPostFromCurrentUser();
  }

  checkIfPostFromCurrentUser() {
    if (this.currentUserId === this.post.userId) {
      this.postFromCurrentUser = true;
      console.log('Post from current user: ', this.postFromCurrentUser);
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
      const documentId = this.post.id
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
      if (this.post.message.trim() === '') {
        console.error('Message is empty');
        return;
      }

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

      await this.postsService.editPost(path, documentId, this.indexPost, this.post.message);

      this.wantToEditMessage = false;
      console.log('Message saved successfully');
    } catch (error) {
      console.error('Error saving message: ', error);
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
