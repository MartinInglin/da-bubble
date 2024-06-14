import {
  Component,
  EventEmitter,
  Input,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Post } from '../../../models/post.class';
import { StorageService } from '../../../services/storage.service';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { Channel } from '../../../models/channel.class';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PostsService } from '../../../services/firestore/posts.service';
import { SnackbarService } from '../../../services/snackbar.service';
import { Reaction } from '../../../models/reaction.class';
import { User } from '../../../models/user.class';
import { SortedReaction } from '../../../models/sorted-reaction.class';

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
  reactionIndex: number = -1;
  showEditMessage: boolean = false;
  editingDisabled: boolean = false;
  postFromCurrentUser: boolean = false;
  wantToEditMessage: boolean = false;
  emojis: string[] = [
    '😊',
    '❤️',
    '😂',
    '🎉',
    '🌟',
    '🎈',
    '🌈',
    '🍕',
    '🚀',
    '⚡',
  ];
  reactionsToDislplay: SortedReaction[] = [];

  @Input() post: Post = new Post();
  @Input() currentUser: User = new User();
  @Input() selectedChannel!: Channel;
  @Input() selectedDirectMessageId: string = '';
  @Input() selectedThreadId: string = '';
  @Input() indexPost!: number;
  @Input() path!: 'directMessages' | 'threads' | 'channels';

  @Output() openThread = new EventEmitter();

  constructor() { }

  ngOnInit() {
    this.checkIfPostFromCurrentUser();
    this.sortReactions();
    console.log(this.post);
    
  }

  // Sort reactions to display
  sortReactions() {
    const reactions: Reaction[] = this.post.reactions;

    for (let i = 0; i < reactions.length; i++) {
      let reaction = reactions[i];

      if (this.reactionsToDislplay.length == 0) {
        let newReaction: SortedReaction = {
          emoji: reaction.emoji,
          userName: [reaction.userName],
          userId: [reaction.userId]
        }
        this.reactionsToDislplay.push(newReaction);
      } else {
        let indexReaction: number = this.checkIfReactionExists(reaction);
        if (indexReaction != -1) {
          let newUserName = reactions[i].userName;
          let newUserId = reactions[i].userId;
          this.reactionsToDislplay[indexReaction].userName.push(newUserName);
          this.reactionsToDislplay[indexReaction].userId.push(newUserId);
        } else {
          let newReaction: SortedReaction = {
            emoji: reaction.emoji,
            userName: [reaction.userName],
            userId: [reaction.userId]
          }
          this.reactionsToDislplay.push(newReaction);
        }
      }
    }
  }

  // Check if reaction exists
  checkIfReactionExists(reaction: Reaction) {
    for (let j = 0; j < this.reactionsToDislplay.length; j++) {
      if (reaction.emoji === this.reactionsToDislplay[j].emoji) {
        return j;
      }
    }
    return -1;
  }

  // Check if post is from current user
  checkIfPostFromCurrentUser() {
    if (this.currentUser.id === this.post.userId) {
      this.postFromCurrentUser = true;
    }
  }

  // Format timestamp to string
  formatDateTime(timestamp: number): string {
    const date = new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes} Uhr`;
  }

  formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes} Uhr`;
  }

  // Download file
  downloadFile(downloadURL: string, e: Event) {
    this.storageService.getFile(downloadURL);
    e.stopPropagation();
  }

  // Delete file
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

  // Delete file on corresponding thread
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

   // Delete file on corresponding channel
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

   // Delete file on a collection
  deleteFileOnCollection(path: string, documentId: string, indexFile: number) {
    const pathToDocument = `${path}/${documentId}`;
    this.postsService.deleteFile(this.indexPost, pathToDocument, indexFile);
  }

  // Toggle edit message display
  toggleShowEditMessage() {
    this.showEditMessage = !this.showEditMessage;
  }

   // Toggle want to edit message state
  toggleWantToEditMessage() {
    if (!this.editingDisabled) {
      this.editingDisabled = true;
      this.wantToEditMessage = true;

      setTimeout(() => {
        const textarea = document.querySelector('textarea');
        if (textarea) {
          textarea.focus();
        }
      }, 0);
    }
  }

// Save edited message
  async saveEditedMessage() {
    try {
      if (this.isMessageEmpty()) {
        this.snackbarService.openSnackBar(
          'Bitte Nachricht eingeben.',
          'Schließen'
        );
        return;
      }
      const { path, documentId } = this.getPathAndDocumentId();

      await this.updatePost(path, documentId);

      await this.updateCorrespondingEntries();

      this.wantToEditMessage = false;
      this.editingDisabled = false;

    } catch (error) {
      console.error('Error saving message: ', error);
    } finally {
      this.editingDisabled = false;
    }
  }

  // Check if message is empty
  isMessageEmpty(): boolean {
    return this.post.message.trim() === '';
  }

  // Get path and document ID
  getPathAndDocumentId(): { path: string; documentId: string } {
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

  // Update post
  async updatePost(path: string, documentId: string): Promise<void> {
    await this.postsService.editPost(
      path,
      documentId,
      this.indexPost,
      this.post.message
    );
  }

  // Update corresponding entries
  async updateCorrespondingEntries(): Promise<void> {
    if (this.path === 'channels') {
      await this.updateCorrespondingThread();
    } else if (this.path === 'threads') {
      await this.updateCorrespondingChannel();
    }
  }

   // Update corresponding thread
  async updateCorrespondingThread(): Promise<void> {
    const threadExists = await this.postsService.checkIfThreadExists(
      this.post.id
    );
    if (threadExists) {
      await this.postsService.editPost(
        'threads',
        this.post.id,
        0,
        this.post.message
      );
    }
  }

   // Update corresponding channel
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

  // Send open thread event to parent
  sendOpenThreadToParent(post: Post) {
    this.openThread.emit(post);
  }

  // Save reaction
  async saveReaction(emoji: string) {
    const reaction: Reaction = {
      userName: this.currentUser.name,
      userId: this.currentUser.id,
      emoji: emoji,
    };

    let documentId;
    let localPath = this.path;
    let localIndexPost = this.indexPost;

    if (localPath === 'channels') {
      documentId = this.selectedChannel.id;
      this.callSaveReactionInPostService(documentId, reaction, localPath);

      localPath = 'threads';
      documentId = this.post.id;
      localIndexPost = 0;
      this.callSaveReactionInPostService(
        documentId,
        reaction,
        localPath,
        localIndexPost
      );
    } else if (localPath === 'directMessages') {
      documentId = this.selectedDirectMessageId;
    } else if (localPath === 'threads') {
      documentId = this.selectedThreadId;
      this.callSaveReactionInPostService(documentId, reaction, localPath);

      localPath = 'channels';
      documentId = this.selectedChannel.id;
      const localIndexPost = await this.postsService.getIndexPostInChannel(
        this.post.id,
        documentId
      );
      this.callSaveReactionInPostService(
        documentId,
        reaction,
        localPath,
        localIndexPost
      );
    } else {
      console.log('Document Id not found.');
    }
  }

  // Call save reaction in post service
  async callSaveReactionInPostService(
    documentId: string,
    reaction: Reaction,
    localPath: string,
    localIndexPost?: number
  ) {
    if (documentId) {
      const indexPost =
        localIndexPost !== undefined ? localIndexPost : this.indexPost;
      await this.postsService.saveReaction(
        reaction,
        localPath,
        documentId,
        this.currentUser,
        indexPost
      );
      this.sortReactions();
    }
  }

  // Toggle tooltip display
  toggleTooltip(show: boolean, index: number) {
    this.showReaction = show;
    this.reactionIndex = index
  }
}
