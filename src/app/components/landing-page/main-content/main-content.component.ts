import { Component, EventEmitter, Output, inject, OnInit, OnDestroy } from '@angular/core';
import { ChannelsService } from '../../../services/firestore/channels.service';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { User } from '../../../models/user.class';
import { UsersService } from '../../../services/firestore/users.service';
import { ThreadsService } from '../../../services/firestore/threads.service';
import { Channel } from '../../../models/channel.class';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
declare const twemoji: any; // Deklariere Twemoji als Modul

@Component({
  selector: 'app-main-content',
  standalone: true,
  imports: [RouterModule, MatButtonModule, MatMenuModule, CommonModule],
  templateUrl: './main-content.component.html',
  styleUrl: './main-content.component.scss',
})
export class MainContentComponent implements OnInit, OnDestroy {
  channelsService = inject(ChannelsService);
  usersService = inject(UsersService);
  threadsService = inject(ThreadsService);

  private userSubscription: Subscription = new Subscription();
  private channelSubscription: Subscription = new Subscription();
  private usersSubscription: Subscription = new Subscription();
  currentUser: User = new User();
  selectedChannel: Channel = new Channel();
  allUsers: User[] = [];
  userId: any;
  emojis: string[] = ["😊", "❤️", "😂", "🎉", "🌟", "🎈", "🌈", "🍕", "🚀", "⚡"];
  // currentChannel: Channel | null = null;

  @Output() openThreadEvent = new EventEmitter<boolean>(); // Event to signal thread opening

  ngOnInit(): void {
    this.userSubscription = this.usersService.currentUser$.subscribe((user) => {
      this.currentUser = user ?? new User();
      console.log('Current User:', this.currentUser);
    });
    this.channelSubscription = this.channelsService.channelSubject$.subscribe((channel) => {
      this.selectedChannel = channel ?? new Channel();
      console.log('Current Channel:', this.selectedChannel);
    });

    this.usersSubscription = this.usersService.allUsersSubject$.subscribe((users) => {
      this.allUsers = users ?? []; // Benutzerdaten aktualisieren
      console.log('All Users:', this.allUsers);
    });
  }

  openThread() {
    this.openThreadEvent.emit(true); // Emit an event when the user opens the thread
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    if (this.channelSubscription) {
      this.channelSubscription.unsubscribe();
    }
    if (this.usersSubscription) {
      this.usersSubscription.unsubscribe(); // Benutzerabonnement aufheben
    }
  }
  showEmoji(emoji: string): string {
    // Verwende Twemoji.show() oder Twemoji.parse() um das Emoji zu rendern
    return twemoji.parse(emoji);
  }

  linkContactInMessage(x: string) {
    let messageTextarea = document.getElementById('message-textarea');
    if (messageTextarea) {
      messageTextarea.textContent += '@' + x + ' '; // Append the name to the textarea with a space
    }
  }

}
