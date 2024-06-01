import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StateService {
  private showContactsSource = new BehaviorSubject<boolean>(false);
  private showChannelsSource = new BehaviorSubject<boolean>(false);

  showContacts$ = this.showContactsSource.asObservable();
  showChannels$ = this.showChannelsSource.asObservable();

  setShowContacts(value: boolean) {
    this.showContactsSource.next(value);
  }

  setShowChannels(value: boolean) {
    this.showChannelsSource.next(value);
  }
}
