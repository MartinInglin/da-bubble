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
import { Reaction } from '../../../models/reaction.class';
import { User } from '../../../models/user.class';
import { SortedReaction } from '../../../models/sorted-reaction.class';
import { EditingStateService } from '../../../services/editing-post.service';

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
  postFromCurrentUser: boolean = false;
  wantToEditMessage: boolean = false;
  originalMessage: string = ''; // Add this line
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
  editingPostIndex: number = -1;

  @Input() post: Post = new Post();
  @Input() currentUser: User = new User();
  @Input() selectedChannel!: Channel;
  @Input() selectedDirectMessageId: string = '';
  @Input() selectedThreadId: string = '';
  @Input() indexPost!: number;
  @Input() path!: 'directMessages' | 'threads' | 'channels';

  @Output() openThread = new EventEmitter();
  @Output() reactionSaved = new EventEmitter<void>();

  constructor(private editingStateService: EditingStateService) { }

  ngOnInit() {
    this.checkIfPostFromCurrentUser();
    this.sortReactions();
  }

  /**
   * This function creates a new array that contains all the reactions and sorts them so they can be displayed.
   */
  sortReactions() {
    const reactions: Reaction[] = this.post.reactions;

    reactions.forEach((reaction) => {
      if (this.reactionsToDislplay.length === 0) {
        this.addNewReaction(reaction);
      } else {
        this.processExistingReactions(reaction);
      }
    });
  }

  /**
   * If the reaction does not exist yet on a post a new reaction is created.
   *
   * @param reaction object of type reaction
   */
  addNewReaction(reaction: Reaction) {
    const newReaction: SortedReaction = {
      emoji: reaction.emoji,
      userName: [reaction.userName],
      userId: [reaction.userId],
    };
    this.reactionsToDislplay.push(newReaction);
  }

  /**
   * This function adds a reaction if the same emoji already exists in the post.
   *
   * @param reaction object of type reaction
   */
  processExistingReactions(reaction: Reaction) {
    const indexReaction = this.checkIfReactionExists(reaction);
    if (indexReaction !== -1) {
      this.addUserToExistingReaction(indexReaction, reaction);
    } else {
      this.addNewReaction(reaction);
    }
  }

  /**
   * If the reaction already exists on the post the user is added to this reaction.
   *
   * @param index number, index of the reaction in the reactions array
   * @param reaction object of type reaction
   */
  addUserToExistingReaction(index: number, reaction: Reaction) {
    this.reactionsToDislplay[index].userName.push(reaction.userName);
    this.reactionsToDislplay[index].userId.push(reaction.userId);
  }

  /**
   * This function checks if the emoji is already stored in the reactions array.
   *
   * @param reaction object of type reaction
   * @returns index of reaction or -1
   */
  checkIfReactionExists(reaction: Reaction) {
    for (let j = 0; j < this.reactionsToDislplay.length; j++) {
      if (reaction.emoji === this.reactionsToDislplay[j].emoji) {
        return j;
      }
    }
    return -1;
  }

  /**
   * This reaction checks if a post is from the current user. This is needed because then the post needs to be displayed differently.
   */
  checkIfPostFromCurrentUser() {
    if (this.currentUser.id === this.post.userId) {
      this.postFromCurrentUser = true;
    }
  }

  /**
   * This function turns a UTX timestamp into a readable value (hours, minutes)
   *
   * @param timestamp number, UTX timestamp
   * @returns string of hours and minutes
   */
  formatDateTime(timestamp: number): string {
    const date = new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes} Uhr`;
  }

  /**
   * This function turns a UTX timestamp into a readable value (day, month, year, hours, minutes)
   *
   * @param timestamp number, UTX timestamp
   * @returns string of day, month, year, hours, minutes
   */
  formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes} Uhr`;
  }

  /**
   * This function downloads a file attached to a post.
   *
   * @param downloadURL  string
   * @param e event
   */
  downloadFile(downloadURL: string, e: Event) {
    this.storageService.getFile(downloadURL);
    e.stopPropagation();
  }

  /**
   * This function deletes a file from a post. Only a signed in user can delete his own files.
   *
   * @param fileName string
   * @param e event
   * @param indexFile number
   */
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

  /**
   * This function is needed to delete a file from a thread if it is deleted in a channel.
   *
   * @param indexFile number
   */
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
      }
    } catch (error) {
      console.log('Failed to delete file on corresponding thread', error);
    }
  }

  /**
   * This function is needed to delete a file from a channel if it is deleted in a thread.
   *
   * @param documentId string
   * @param indexFile number
   */
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

  /**
   * This function deletes a file on a post in a given collection.
   *
   * @param path string of 'channels', directMessages' or 'threads'
   * @param documentId string
   * @param indexFile number
   */
  deleteFileOnCollection(path: string, documentId: string, indexFile: number) {
    const pathToDocument = `${path}/${documentId}`;
    this.postsService.deleteFile(this.indexPost, pathToDocument, indexFile);
  }

  /**
   * This function restricts the user from editing multiple posts at the same time.
   *
   * @returns
   */
  toggleShowEditMessage(event: MouseEvent) {
    if (this.editingStateService.getEditingPostIndex() !== -1) {
      this.snackbarService.openSnackBar(
        'Du kannst nur eine Nachricht gleichzeitig bearbeiten.',
        'Schließen'
      );
      return;
    }
    this.showEditMessage = !this.showEditMessage;
    event?.stopPropagation();
  }

  closeEditMessage() {
    this.showEditMessage = false;
  }

  /**
   * This function lets a user start editing their post.
   */
  toggleWantToEditMessage() {
    if (this.editingStateService.getEditingPostIndex() === -1) {
      this.wantToEditMessage = true;
      this.editingStateService.setEditingPostIndex(this.indexPost);
      this.originalMessage = this.post.message; // Save the original message

      setTimeout(() => {
        const textarea = document.querySelector('textarea');
        if (textarea) {
          textarea.focus();
        }
      }, 0);
    }
  }

  /**
   * This function saves an edited message.
   *
   * @returns
   */
  async saveEditedMessage() {
    try {
      if (this.isMessageEmpty()) {
        this.snackbarService.openSnackBar(
          'Bitte Nachricht eingeben.',
          'Schließen'
        );
        return;
      }
      const documentId = this.getDocumentId();
      await this.updatePost(this.path, documentId);
      await this.updateCorrespondingEntries();
      this.wantToEditMessage = false;
    } catch (error) {
      console.error('Error saving message: ', error);
    } finally {
      this.editingStateService.clearEditingPostIndex();
    }
  }

  /**
   * This function checks if the user has entered an empty string when he edits a post.
   *
   * @returns boolean
   */
  isMessageEmpty(): boolean {
    return this.post.message.trim() === '';
  }

  /**
   * This function gets the document ID depending on the selected path.
   *
   * @returns document ID.
   */
  getDocumentId(): string {
    let documentId: string = '';
    if (this.path === 'channels') {
      documentId = this.selectedChannel.id;
    } else if (this.path === 'directMessages') {
      documentId = this.selectedDirectMessageId;
    } else if (this.path === 'threads') {
      documentId = this.selectedThreadId;
    }

    return documentId;
  }

  /**
   * This function saves the edits a user does to a post.
   *
   * @param path string of channels, directMessages or threads
   * @param documentId string
   */
  async updatePost(path: string, documentId: string): Promise<void> {
    await this.postsService.editPost(
      path,
      documentId,
      this.indexPost,
      this.post.message
    );
  }

  /**
   * This function updates a corresponding thread or channel if the user edits a post.
   */
  async updateCorrespondingEntries(): Promise<void> {
    if (this.path === 'channels') {
      await this.updateCorrespondingThread();
    } else if (this.path === 'threads') {
      await this.updateCorrespondingChannel();
    }
  }

  /**
   * This function updates a thread if a user edits a corresponding post in a channel.
   */
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

  /**
   * This function updates a channel if a user edits a corresponding post in a thread.
   */
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

  /**
   * This function emits an event to its parent to open the thread on the right side.
   *
   * @param post object of type post
   */
  sendOpenThreadToParent(post: Post) {
    this.openThread.emit(post);
  }

  /**
   * This function starts the saving process if a user reacts with an emoji to a post.
   *
   * @param emoji string
   */
  async saveReaction(emoji: string) {
    const reaction: Reaction = this.createReaction(emoji);
    let documentId = '';
    let localPath = this.path;
    let localIndexPost = this.indexPost;
  
    try {
      switch (localPath) {
        case 'channels':
          documentId = this.selectedChannel.id;
          await this.handleChannelReactions(documentId, reaction, localPath, localIndexPost);
          break;
        case 'directMessages':
          documentId = this.selectedDirectMessageId;
          await this.callSaveReactionInPostService(documentId, reaction, localPath, localIndexPost);
          break;
        case 'threads':
          documentId = this.selectedThreadId;
          await this.handleThreadReactions(documentId, reaction, localPath);
          break;
        default:
          console.log('Document Id not found.');
      }
    } catch (error) {
      console.error('Error saving reaction:', error);
      // Handle errors appropriately, e.g., show a snackbar to the user
    } finally {
      // Prevent default behavior here to avoid unnecessary reloads
      event?.preventDefault(); // Assuming you have an event object passed to the function
    }
  }

  /**
   * This function creates a new reaction object.
   *
   * @param emoji string
   * @returns object of type reaction
   */
  createReaction(emoji: string): Reaction {
    return {
      userName: this.currentUser.name,
      userId: this.currentUser.id,
      emoji: emoji,
    };
  }

  /**
   * This function saves a reaction on a post in case it is done in a channel. The callSaveReactionInPostService function is called twice because a corresponding thread might be updated as well.
   *
   * @param documentId string
   * @param reaction object of type reaction
   * @param localPath string
   * @param localIndexPost number
   */
  async handleChannelReactions(
    documentId: string,
    reaction: Reaction,
    localPath: string,
    localIndexPost: number
  ) {
    await this.callSaveReactionInPostService(documentId, reaction, localPath);

    const threadExists = this.postsService.checkIfThreadExists(this.post.id);
    if (await threadExists) {
      this.updateCorrespondingThreadReaction(
        localPath,
        documentId,
        localIndexPost,
        reaction
      );
    }
  }

  /**
   * If a corresponding thread to a channel exists this function will update the reaction.
   *
   * @param localPath string
   * @param documentId string
   * @param localIndexPost number
   * @param reaction object of type reaction
   */
  async updateCorrespondingThreadReaction(
    localPath: string,
    documentId: string,
    localIndexPost: number,
    reaction: Reaction
  ) {
    localPath = 'threads';
    documentId = this.post.id;
    localIndexPost = 0;
    await this.callSaveReactionInPostService(
      documentId,
      reaction,
      localPath,
      localIndexPost
    );
  }

  /**
   * This function saves a reaction on a post in case it is done in a thread. The callSaveReactionInPostService function is called twice because a corresponding channel might be updated as well.
   *
   * @param documentId string
   * @param reaction object of type reaction
   * @param localPath string
   */
  async handleThreadReactions(
    documentId: string,
    reaction: Reaction,
    localPath: string
  ) {
    await this.callSaveReactionInPostService(documentId, reaction, localPath);

    localPath = 'channels';
    documentId = this.selectedChannel.id;
    const localIndexPost = await this.postsService.getIndexPostInChannel(
      this.post.id,
      documentId
    );
    if (localIndexPost >= 0) {
      await this.callSaveReactionInPostService(
        documentId,
        reaction,
        localPath,
        localIndexPost
      );
    }
  }

  /**
   * This function calls the save reaction function in the posts service which stores it in firebase.
   *
   * @param documentId string
   * @param reaction object of type reaction
   * @param localPath string
   * @param localIndexPost number
   */
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

  /**
  * Extracts the first and last word of a given name.
  * @param {string} name - The full name of the user.
  * @returns {string} - The processed name containing only the first and last word.
  */
  getFirstAndLastName(name: string): string {
    const words = name.split(' ');
    if (words.length > 1) {
      return `${words[0]} ${words[words.length - 1]}`;
    }
    return name;
  }

  /**
   * This function toggles the tooltip that displays who reacted on a post.
   *
   * @param show boolean
   * @param index number
   */
  toggleTooltip(show: boolean, index: number) {
    this.showReaction = show;
    this.reactionIndex = index;
  }

  /**
   * This function discards the changes made to the post and restores the original message.
   */
  discardChanges() {
    this.post.message = this.originalMessage; // Restore the original message
    this.wantToEditMessage = false;
    this.editingStateService.clearEditingPostIndex();
  }
}
