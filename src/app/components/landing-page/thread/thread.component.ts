import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  EventEmitter,
  OnInit,
  inject,
  Output,
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
    PostInputComponent
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
  selectedThread: Thread = new Thread();

  channelsService = inject(ChannelsService);
  usersService = inject(UsersService);
  threadsService = inject(ThreadsService);
  stateService = inject(StateService);

  private usersSubscription: Subscription = new Subscription();
  private userSubscription: Subscription = new Subscription();
  private channelSubscription: Subscription = new Subscription();
  private threadSubscription: Subscription = new Subscription();

  @Output() commentsChanged: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() toggleThread = new EventEmitter<void>();
  @Output() closeSideNav = new EventEmitter<void>(); 
  @Input() channelId: string = ''; // Kanal-ID als Eingabe für die Thread-Komponente
  @Input() threadId: string = ''; // Thread-ID als Eingabe für die Thread-Komponente

  constructor() { }

  ngOnInit(): void {
    // Subscribe to currentUser observable from usersService
    this.userSubscription = this.usersService.currentUser$.subscribe((user) => {
      this.currentUser = user ?? new User();
    });

     // Subscribe to allUsers observable from usersService
    this.usersSubscription = this.usersService.allUsersSubject$.subscribe(
      (users) => {
        this.allUsers = users ?? []; // Benutzerdaten aktualisieren
      }
    );

    // Subscribe to selectedChannel observable from channelsService
    this.channelSubscription = this.channelsService.channelSubject$.subscribe(
      (channel) => {
        this.selectedChannel = channel ?? new Channel();
      }
    );
    
    if (this.selectedThread) {
      this.stateService.closeSideNav();
    }

    // Subscribe to selectedThread observable from threadsService
    this.threadSubscription = this.threadsService.threadSubject$.subscribe(
      (thread) => {
        this.selectedThread = thread ?? new Thread();
        if (thread) {
          this.closeSideNav.emit(); // Emit the event to close the SideNav when a thread is opened
        } // Close SideNav when thread is selected
      }
    );
  }

  // Unsubscribe from all observables
  ngOnDestroy(): void {
    this.userSubscription.unsubscribe();
    this.usersSubscription.unsubscribe();
    this.channelSubscription.unsubscribe();
    this.threadSubscription.unsubscribe();
  }

  // Emit toggleThread event
  closeThread(): void {
    this.toggleThread.emit();
  }

  // Array of days of the week in German
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
    const today = new Date(); // Aktuelles Datum
    const dayOfWeekIndex = date.getDay(); // Hole den Wochentag als Zahl (0-6)

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    const formattedDate = `${day}.${month}.${year}`;

    // Überprüfe, ob das Datum heute ist
    if (date.toDateString() === today.toDateString()) {
      this.dateForLine = 'heute';
      return 'heute'; // Gib 'heute' zurück, wenn das Datum heute ist
    } else {
      this.dateForLine = `${daysOfWeek[dayOfWeekIndex]} ${formattedDate}`;
      return `${daysOfWeek[dayOfWeekIndex]} ${formattedDate}`; // Andernfalls gib den Namen des Wochentags zurück
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
      const currentPostDate = this.formatDate(this.selectedThread.posts[index + 1].timestamp);
      const previousPostDate = this.formatDate(this.selectedThread.posts[index].timestamp);
      return currentPostDate !== previousPostDate;

  }
}
