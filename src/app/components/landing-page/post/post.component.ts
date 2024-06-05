import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Post } from '../../../models/post.class';
import { StorageService } from '../../../services/storage.service';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { ThreadsService } from '../../../services/firestore/threads.service';
import { Channel } from '../../../models/channel.class';

@Component({
  selector: 'app-post',
  standalone: true,
  imports: [CommonModule, MatMenuModule],
  templateUrl: './post.component.html',
  styleUrl: './post.component.scss',
})
export class PostComponent {
  storageService = inject(StorageService);
  threadService = inject(ThreadsService);

  showMenu: boolean = false;
  showReaction: boolean = false;
  reactionIndex: number = 0;
  showEditMessage: boolean = false;
  postFromCurrentUser: boolean = false;

  @Input() post: Post = new Post();
  @Input() currentUserId: string = '';
  @Input() selectedChannel!: Channel;
  @Input() isChannel: boolean = false;

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

  downloadFile(downloadURL: string) {
    this.storageService.getFile(downloadURL);
  }

  toggleShowEditMessage() {
    this.showEditMessage = !this.showEditMessage;
    console.log(this.showEditMessage);
  }

  // openThread(): void {
  //   this.toggleThread.emit();

  // }
}
