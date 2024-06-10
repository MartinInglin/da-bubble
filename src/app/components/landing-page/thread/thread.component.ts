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

  private usersSubscription: Subscription = new Subscription();
  private userSubscription: Subscription = new Subscription();
  private channelSubscription: Subscription = new Subscription();
  private threadSubscription: Subscription = new Subscription();

  @Output() commentsChanged: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() toggleThread = new EventEmitter<void>();
  @Input() channelId: string = ''; // Kanal-ID als Eingabe für die Thread-Komponente
  @Input() threadId: string = ''; // Thread-ID als Eingabe für die Thread-Komponente

  constructor() { }

  ngOnInit(): void {
    this.userSubscription = this.usersService.currentUser$.subscribe((user) => {
      this.currentUser = user ?? new User();
    });

    this.usersSubscription = this.usersService.allUsersSubject$.subscribe(
      (users) => {
        this.allUsers = users ?? []; // Benutzerdaten aktualisieren
      }
    );
    this.channelSubscription = this.channelsService.channelSubject$.subscribe(
      (channel) => {
        this.selectedChannel = channel ?? new Channel();
      }
    );
    this.threadSubscription = this.threadsService.threadSubject$.subscribe(
      (thread) => {
        this.selectedThread = thread ?? new Thread();
      }
    );
  }

  ngOnDestroy(): void {
    this.userSubscription.unsubscribe();
    this.usersSubscription.unsubscribe();
    this.channelSubscription.unsubscribe();
    this.threadSubscription.unsubscribe();
  }

  closeThread(): void {
    this.toggleThread.emit();
  }

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
}
