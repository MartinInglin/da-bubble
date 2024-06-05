import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { Channel } from '../models/channel.class';
import { User } from '../models/user.class';
import { UsersService } from './firestore/users.service';
import { ChannelsService } from './firestore/channels.service';
import { CommonModule } from '@angular/common';


@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private channels = new BehaviorSubject<Channel[]>([]);
  private contacts = new BehaviorSubject<User[]>([]);

  usersService = inject(UsersService);
  channelsService = inject(ChannelsService);


  ngOnInit(): void {
    // ... existing subscriptions and null check logic
  
    this.channelsService.getDataChannel; // Trigger initial channel data fetch (if needed)
    this.usersService.getAllUsers(); // Trigger initial user data fetch (if needed)
  }

  setChannels(channels: Channel[]) {
    console.log('Updating channels:', channels);
    this.channels.next(channels);
  }

  setContacts(contacts: User[]) {
    console.log('Updating contacts:', contacts);
    this.contacts.next(contacts);
  }

  search(term: string): Observable<(Channel | User)[]> {
    console.log('Search Term:', term);
  console.log('Channels:', this.channels.getValue());
    return combineLatest([this.channels, this.contacts]).pipe(
      map(([channels, contacts]) => {
        const filteredChannels = channels.filter(channel => channel.name.includes(term));
        const filteredContacts = contacts.filter(contact => contact.name.includes(term));
        console.log('Filtered Channels:', filteredChannels);
        console.log('Filtered Contacts:', filteredContacts);
        return [...filteredChannels, ...filteredContacts];
      })
    );
}

}