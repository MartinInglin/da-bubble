import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ScrollDownService {
  private scrollDownChannelSubject = new Subject<void>();
  scrollDownChannel$ = this.scrollDownChannelSubject.asObservable();

  private scrollDownDirectMessageSubject = new Subject<void>();
  scrollDownDirectMessage$ = this.scrollDownDirectMessageSubject.asObservable();

  scrollDownChannel() {
    this.scrollDownChannelSubject.next();
  }

  scrollDownDirectMessage() {
    this.scrollDownDirectMessageSubject.next();
  }
}
