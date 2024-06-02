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
import { DirectMessage } from '../../../models/direct-message.class';
import { Thread } from '../../../models/thread.class';
import { PostComponent } from '../post/post.component';

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
  ],
  templateUrl: './thread.component.html',
  styleUrl: './thread.component.scss',
})
export class ThreadComponent implements OnInit {
  allUsers: User[] = [];
  comments: boolean = true;
  message: string = '';
  currentUser: User = new User();
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
  userId: any;
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
        console.log('Current thread', this.selectedThread);
      }
    );
  }

  ngOnDestroy(): void {
    this.userSubscription.unsubscribe();
    this.usersSubscription.unsubscribe();
    this.channelSubscription.unsubscribe();
    this.threadSubscription.unsubscribe();
  }

  toggleComments() {
    this.comments = true;
  }

  directMessage = new DirectMessage({
    id: '123',
    users: [
      { id: '1', avatar: 'path_to_avatar1' },
      { id: '2', avatar: 'path_to_avatar2' },
      // more users...
    ],
    posts: [],
  });

  savePost() {
    if (this.channelId && this.threadId && this.message && this.currentUser) {
      this.threadsService.savePost(
        this.channelId,
        this.threadId,
        this.message,
        this.currentUser
      );
      console.log('Beitrag erfolgreich gespeichert');
    } else {
      console.error('Fehlende Daten für die Speicherung des Beitrags');
    }
  }

  linkContactInMessage(x: string) {
    let messageTextarea = document.getElementById('message-textarea');
    if (messageTextarea) {
      messageTextarea.textContent += '@' + x + ' '; // Append the name to the textarea with a space
    }
  }

  closeThread(): void {
    this.toggleThread.emit();
  }
}
