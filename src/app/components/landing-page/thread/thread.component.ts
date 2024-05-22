import { CommonModule } from '@angular/common';
import { Component, Input, EventEmitter, OnInit, inject} from '@angular/core';
import { User } from '../../../models/user.class';
import { ThreadsService } from '../../../services/firestore/threads.service';
import { FormsModule } from '@angular/forms';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { ChannelsService } from '../../../services/firestore/channels.service';
import { UsersService } from '../../../services/firestore/users.service';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-thread',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatButtonModule, MatMenuModule,],
  templateUrl: './thread.component.html',
  styleUrl: './thread.component.scss'
})
export class ThreadComponent implements OnInit {
  allUsers: User[] = [];
  comments: boolean = true;
  message: string = '';
  currentUser: User = new User();
  emojis: string[] = ["😊", "❤️", "😂", "🎉", "🌟", "🎈", "🌈", "🍕", "🚀", "⚡"];
  userId: any;

  channelsService = inject(ChannelsService);
  usersService = inject(UsersService);

  private usersSubscription: Subscription = new Subscription();
  private userSubscription: Subscription = new Subscription();



  @Input() openThreadEvent: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Input() channelId: string = ''; // Kanal-ID als Eingabe für die Thread-Komponente
  @Input() threadId: string = ''; // Thread-ID als Eingabe für die Thread-Komponente
  // @Input() currentUser: User | null = null; // Aktueller Benutzer als Eingabe für die Thread-Komponente


  ngOnInit(): void {

    // this.openThreadEvent.subscribe(() => { // Abonnieren des Ereignisses beim Initialisieren der Komponente
    // this.openThread();
    this.userSubscription = this.usersService.currentUser$.subscribe((user) => {
      this.currentUser = user ?? new User();
      console.log('Current User:', this.currentUser);
    });

    this.usersSubscription = this.usersService.allUsersSubject$.subscribe((users) => {
      this.allUsers = users ?? []; // Benutzerdaten aktualisieren
      console.log('All Users:', this.allUsers);
    });

  }
  constructor(private threadsService: ThreadsService) { }

  openThread() {
    // this.openThreadEvent.subscribe(() => { // Subscribe on component initialization
    this.comments = true;
    console.log('thread öffnet sich');

    ;
  }

  savePost() {

    if (this.channelId && this.threadId && this.message && this.currentUser) {
      this.threadsService.savePost(this.channelId, this.threadId, this.message, this.currentUser);
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

}


