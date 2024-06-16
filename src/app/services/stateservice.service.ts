import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * This service manages the application's state related to showing contacts and channels.
 */
@Injectable({
  providedIn: 'root' 
})
export class StateService {

  /**
   * Internal BehaviorSubject to store the state of showing contacts.
   * - Initial value: `false` (contacts are not shown by default)
   */
  private showContactsSource = new BehaviorSubject<boolean>(false);

  /**
   * Observable representing the current state of showing contacts.
   * Components can subscribe to this observable to react to changes.
   */
  showContacts$ = this.showContactsSource.asObservable();

  /**
   * Internal BehaviorSubject to store the state of showing channels.
   * - Initial value: `false` (channels are not shown by default)
   */
  private showChannelsSource = new BehaviorSubject<boolean>(false);

  /**
   * Observable representing the current state of showing channels.
   * Components can subscribe to this observable to react to changes.
   */
  showChannels$ = this.showChannelsSource.asObservable();

  /**
   * Sets the state of showing contacts in the application.
   *
   * @param value - Boolean value indicating whether to show contacts (`true`) or hide them (`false`).
   */
  setShowContacts(value: boolean) {
    this.showContactsSource.next(value);
  }

  /**
   * Sets the state of showing channels in the application.
   *
   * @param value - Boolean value indicating whether to show channels (`true`) or hide them (`false`).
   */
  setShowChannels(value: boolean) {
    this.showChannelsSource.next(value);
  }
}
