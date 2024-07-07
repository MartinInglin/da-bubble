import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  EventEmitter,
  OnInit,
  inject,
  Output,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { User } from '../../../models/user.class';
import { ThreadsService } from '../../../services/firestore/threads.service';
import { FormsModule } from '@angular/forms';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { ChannelsService } from '../../../services/firestore/channels.service';
import { UsersService } from '../../../services/firestore/users.service';
import { Subscription } from 'rxjs';
import { Channel } from '../../../models/channel.class';
import { Thread } from '../../../models/thread.class';
import { PostComponent } from '../post/post.component';
import { PostInputComponent } from '../post-input/post-input.component';
import { StateService } from '../../../services/stateservice.service';
import { DirectMessage } from '../../../models/direct-message.class';
import { DirectMessagesService } from '../../../services/firestore/direct-messages.service';
import { Post } from '../../../models/post.class';

@Component({
  selector: 'app-thread',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatButtonModule,
    MatMenuModule,
    PostComponent,
    PostInputComponent,
  ],
  templateUrl: './thread.component.html',
  styleUrl: './thread.component.scss',
})
export class ThreadComponent implements OnInit {
  dateForLine: string = '';
  allUsers: User[] = [];
  comments: boolean = true;
  currentUser: User = new User();
  selectedChannel: Channel = new Channel();
  selectedDirectMessage: DirectMessage = new DirectMessage();
  selectedThread: Thread = new Thread();

  channelsService = inject(ChannelsService);
  usersService = inject(UsersService);
  threadsService = inject(ThreadsService);
  directMessagesService = inject(DirectMessagesService);
  stateService = inject(StateService);

  private usersSubscription: Subscription = new Subscription();
  private userSubscription: Subscription = new Subscription();
  private channelSubscription: Subscription = new Subscription();
  private threadSubscription: Subscription = new Subscription();
  private directMessageSubscription: Subscription = new Subscription();

  @Output() commentsChanged: EventEmitter<boolean> =
    new EventEmitter<boolean>();
  @Output() toggleThread = new EventEmitter<void>();
  @Output() closeSideNav = new EventEmitter<void>();
  @Input() channelId: string = '';
  @Input() threadId: string = '';
  @Input() isOpen: boolean = false;
  closeThreadSubscription: Subscription = new Subscription();

  @ViewChild(PostInputComponent) postInputComponent!: PostInputComponent;
  @ViewChild('threadMessageContent') threadMessageContent!: ElementRef;

  constructor() { }

  /**
   * Lifecycle hook that is called after the component's view has been fully initialized.
   * Initializes various subscriptions for the component.
   */
  ngOnInit(): void {
    this.initializeUserSubscription();
    this.initializeUsersSubscription();
    this.initializeChannelSubscription();
    this.checkAndCloseSideNav();
    this.initializeThreadSubscription();
    this.initializeDirectMessageSubscription();
  }

  /**
   * Initializes the subscription to the currentUser$ observable from the usersService.
   * Sets the current user.
   * 
   * @private
   */
  private initializeUserSubscription(): void {
    this.userSubscription = this.usersService.currentUser$.subscribe((user) => {
      this.currentUser = user ?? new User();
    });
  }

  /**
   * Initializes the subscription to the allUsersSubject$ observable from the usersService.
   * Sets the list of all users.
   * 
   * @private
   */
  private initializeUsersSubscription(): void {
    this.usersSubscription = this.usersService.allUsersSubject$.subscribe((users) => {
      this.allUsers = users ?? [];
    });
  }

  /**
   * Initializes the subscription to the channelSubject$ observable from the channelsService.
   * Sets the selected channel.
   * 
   * @private
   */
  private initializeChannelSubscription(): void {
    this.channelSubscription = this.channelsService.channelSubject$.subscribe((channel) => {
      this.selectedChannel = channel ?? new Channel();
    });
  }

  /**
   * Checks if a thread is selected and closes the side navigation if true.
   * 
   * @private
   */
  private checkAndCloseSideNav(): void {
    if (this.selectedThread) {
      this.stateService.closeSideNav();
    }
  }

  /**
   * Initializes the subscription to the threadSubject$ observable from the threadsService.
   * Sets the selected thread and closes the side navigation if a thread is selected.
   * 
   * @private
   */
  private initializeThreadSubscription(): void {
    this.threadSubscription = this.threadsService.threadSubject$.subscribe((thread) => {
      this.selectedThread = thread ?? new Thread();
      if (thread) {
        this.closeSideNav.emit();
      }
    });
  }

  /**
   * Initializes the subscription to the directMessage$ observable from the directMessagesService.
   * Sets the selected direct message.
   * 
   * @private
   */
  private initializeDirectMessageSubscription(): void {
    this.directMessageSubscription = this.directMessagesService.directMessage$.subscribe((directMessage) => {
      this.selectedDirectMessage = directMessage ?? new DirectMessage();
    });
  }

  /**
   * Closes the thread and emits an event to toggle the thread state.
   * 
   * @private
   */
  closeThread(): void {
    this.isOpen = false;
    this.toggleThread.emit();
  }

  /**
   * Formats a given timestamp into a string representing the date.
   * The format includes the day of the week and the date in DD.MM.YY format.
   * If the timestamp corresponds to today's date, it returns 'heute'.
   * 
   * @private
   * @param {number} timestamp - The timestamp to format.
   * @returns {string} The formatted date string.
   */
  formatDate(timestamp: number): string {
    const daysOfWeek = [
      'Sonntag',
      'Montag',
      'Dienstag',
      'Mittwoch',
      'Donnerstag',
      'Freitag',
      'Samstag',
    ];
    const date = new Date(timestamp);
    const today = new Date();
    const dayOfWeekIndex = date.getDay();

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    const formattedDate = `${day}.${month}.${year}`;

    if (date.toDateString() === today.toDateString()) {
      this.dateForLine = 'heute';
      return 'heute';
    } else {
      this.dateForLine = `${daysOfWeek[dayOfWeekIndex]} ${formattedDate}`;
      return `${daysOfWeek[dayOfWeekIndex]} ${formattedDate}`;
    }
  }

  /**
   * This function is needed for the date line. It checks if the date of the new post is the same as the the date of the previous one.
   *
   * @param index number, index of the post
   * @returns boolean
   */
  isNewDate(index: number) {
    if (index === 0) {
      return true;
    }
    const currentPostDate = this.formatDate(
      this.selectedThread.posts[index + 1].timestamp
    );
    const previousPostDate = this.formatDate(
      this.selectedThread.posts[index].timestamp
    );
    return currentPostDate !== previousPostDate;
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
   * Calls the setFocus method on the postInputComponent to set focus on the input element.
   * 
   * @private
   */
  callSetFocus(): void {
    this.postInputComponent.setFocus();
  }

  scrollToBottomThread(): void {
    this.threadMessageContent.nativeElement.scrollTop =
      this.threadMessageContent.nativeElement.scrollHeight;
}

  /**
   * Angular lifecycle hook that is called when the component is destroyed.
   * Unsubscribes from all active subscriptions to prevent memory leaks.
   */
  ngOnDestroy(): void {
    this.userSubscription.unsubscribe();
    this.usersSubscription.unsubscribe();
    this.channelSubscription.unsubscribe();
    this.threadSubscription.unsubscribe();
    this.directMessageSubscription.unsubscribe();
    if (this.closeThreadSubscription) {
      this.closeThreadSubscription.unsubscribe();
    }
  }
}
