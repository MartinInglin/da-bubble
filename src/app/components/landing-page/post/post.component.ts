import { Component, Input, inject } from '@angular/core';
import { Post } from '../../../models/post.class';
import { StorageService } from '../../../services/storage.service';
import { CommonModule } from '@angular/common';
import {MatMenuModule} from '@angular/material/menu'; 

@Component({
  selector: 'app-post',
  standalone: true,
  imports: [CommonModule, MatMenuModule],
  templateUrl: './post.component.html',
  styleUrl: './post.component.scss',
})
export class PostComponent {
  storageService = inject(StorageService);

  showMenu: boolean = false;
  showReaction: boolean = false;
  reactionIndex: number = 0;
  showEditMessage: boolean = false;

  @Input() post: Post = new Post();

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
  
}
