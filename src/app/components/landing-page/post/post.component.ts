import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
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
  imports: [CommonModule, MatMenuModule, MatTooltipModule],
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

  @Input() post: Post = new Post();
  @Input() currentUserId: string = '';
  @Input() selectedChannel!: Channel;
  @Input() selectedDirectMessageId: string = '';
  @Input() selectedThreadId: string = '';
  @Input() indexPost!: number;
  @Input() path!: 'directMessages' | 'threads' | 'channels';

  @Output() openThread = new EventEmitter();

  ngOnInit() {
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
    let pathToDocument: string = '';

    if (this.path === 'directMessages') {
      pathToDocument = `${this.path}/${this.selectedDirectMessageId}`;
      this.postsService.deleteFile(this.indexPost, pathToDocument, indexFile);
      e.stopPropagation();
    } else if (this.path === 'channels') {
      pathToDocument = `${this.path}/${this.selectedChannel.id}`;
      this.postsService.deleteFile(this.indexPost, pathToDocument, indexFile);
      e.stopPropagation();

      try {
        pathToDocument = `channels/${this.selectedChannel.id}/threads/${this.post.id}`;
        const threadExists = await this.postsService.checkIfThreadExists(
          pathToDocument
        );
        if (threadExists) {
          this.indexPost = 0;
          this.postsService.deleteFile(
            this.indexPost,
            pathToDocument,
            indexFile
          );
        } else {
          console.log('Thread does not exist');
        }
      } catch (error) {
        console.error('Error checking if thread exists:', error);
      }
    } else if (this.path === 'threads') {
      pathToDocument = `channels/${this.selectedChannel.id}/${this.path}/${this.selectedThreadId}`;
      this.postsService.deleteFile(this.indexPost, pathToDocument, indexFile);
      e.stopPropagation();

      if (this.indexPost == 0) {
        pathToDocument = `channels/${this.selectedChannel.id}`;
        try {
          this.indexPost = await this.postsService.getIndexPostInChannel(
            this.post.id,
            pathToDocument
          );
        } catch (error) {
          console.error('Error setting indexPost:', error);
        }
        this.postsService.deleteFile(this.indexPost, pathToDocument, indexFile);
        e.stopPropagation();
      }
    }

    this.storageService.deleteFile(this.post.id, fileName);
    e.stopPropagation();
  }

  toggleShowEditMessage() {
    this.showEditMessage = !this.showEditMessage;
    console.log(this.showEditMessage);
  }

  sendOpenThreadToParent(post: Post) {
    this.openThread.emit(post);
  }
}
