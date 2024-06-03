import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { DirectMessage } from '../models/direct-message.class';
import { Channel } from '../models/channel.class';
import { User } from '../models/user.class';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private channels = new BehaviorSubject<Channel[]>([]);
  private contacts = new BehaviorSubject<User[]>([]);

  setChannels(channels: Channel[]) {
    this.channels.next(channels);
  }

  setContacts(contacts: User[]) {
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