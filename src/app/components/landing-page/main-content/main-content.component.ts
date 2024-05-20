import { Component, EventEmitter, Output, inject } from '@angular/core';
import { ChannelsService } from '../../../services/firestore/channels.service';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { User } from '../../../models/user.class';
import { UsersService } from '../../../services/firestore/users.service';
import { ThreadsService } from '../../../services/firestore/threads.service';
import { Channel } from '../../../models/channel.class';

@Component({
  selector: 'app-main-content',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './main-content.component.html',
  styleUrl: './main-content.component.scss',
})
export class MainContentComponent {
  channelsService = inject(ChannelsService);
  usersService = inject(UsersService);
  threadsService = inject(ThreadsService);

  private userSubscription: Subscription = new Subscription();
  private channelSubscription: Subscription = new Subscription();
  currentUser: User = new User();
  selectedChannel: Channel = new Channel();

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
  }
}
