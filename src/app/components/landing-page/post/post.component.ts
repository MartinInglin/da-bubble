import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Post } from '../../../models/post.class';
import { StorageService } from '../../../services/storage.service';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { ThreadsService } from '../../../services/firestore/threads.service';
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
  @Input() isChannel: boolean = false;
  @Input() selectedDirectMessageId: string = '';
  @Input() indexPost!: number;
  @Input() path!: 'directMessages' | 'threads' | 'channels';

  @Output() toggleThread = new EventEmitter<void>();

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

  deleteFile(fileName: string, e: Event, indexFile: number) {
    let documentId: string = '';

    if (this.path === 'directMessages' ) {
      debugger;
      documentId = this.selectedDirectMessageId;
    }
    if (this.path === 'channels') {
      debugger;
      documentId = this.selectedChannel.id;
    }
    this.postsService.deleteFile(
      this.indexPost,
      documentId,
      this.path,
      indexFile
    );
    this.storageService.deleteFile(this.post.id, fileName);
    e.stopPropagation();
  }

  toggleShowEditMessage() {
    this.showEditMessage = !this.showEditMessage;
    console.log(this.showEditMessage);
  }
}
