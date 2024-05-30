import { CommonModule } from '@angular/common';
import { Component, Input, EventEmitter, OnInit, inject, Output } from '@angular/core';
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
import { DirectMessage } from '../../../models/direct_message.class';


@Component({
  selector: 'app-thread',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatButtonModule, MatMenuModule],
  templateUrl: './thread.component.html',
  styleUrl: './thread.component.scss'
})
export class ThreadComponent implements OnInit {
  allUsers: User[] = [];
  comments: boolean = false;
  message: string = '';
  currentUser: User = new User();
  emojis: string[] = ["😊", "❤️", "😂", "🎉", "🌟", "🎈", "🌈", "🍕", "🚀", "⚡"];
  userId: any;
  selectedChannel: Channel = new Channel();


  channelsService = inject(ChannelsService);
  usersService = inject(UsersService);

  private usersSubscription: Subscription = new Subscription();
  private userSubscription: Subscription = new Subscription();
  private channelSubscription: Subscription = new Subscription();



  @Output() commentsChanged: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Input() openThreadEvent: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Input() channelId: string = ''; // Kanal-ID als Eingabe für die Thread-Komponente
  @Input() threadId: string = ''; // Thread-ID als Eingabe für die Thread-Komponente

  constructor(private threadsService: ThreadsService, private channelService: ChannelsService, private userService: UsersService) { }

  ngOnInit(): void {



    this.userSubscription = this.usersService.currentUser$.subscribe((user) => {
      this.currentUser = user ?? new User();
    });

    this.usersSubscription = this.usersService.allUsersSubject$.subscribe((users) => {
      this.allUsers = users ?? []; // Benutzerdaten aktualisieren
    });
    this.channelSubscription = this.channelsService.channelSubject$.subscribe(
      (channel) => {
        this.selectedChannel = channel ?? new Channel();
      }
    );
  }


  ngOnDestroy(): void {
    this.userSubscription.unsubscribe();
    this.usersSubscription.unsubscribe();
    this.channelSubscription.unsubscribe();
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
    posts: []
  });


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


openThread(){
  this.comments = true;
}


}


