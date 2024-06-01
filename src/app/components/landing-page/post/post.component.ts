import { Component, Input, inject } from '@angular/core';
import { Post } from '../../../models/post.class';
import { StorageService } from '../../../services/storage.service';

@Component({
  selector: 'app-post',
  standalone: true,
  imports: [],
  templateUrl: './post.component.html',
  styleUrl: './post.component.scss',
})
export class PostComponent {
  storageService = inject(StorageService);

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
}
