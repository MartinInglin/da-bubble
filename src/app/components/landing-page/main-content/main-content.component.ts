import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-main-content',
  standalone: true,
  imports: [],
  templateUrl: './main-content.component.html',
  styleUrl: './main-content.component.scss',

})
export class MainContentComponent {

  @Output() openThreadEvent = new EventEmitter<boolean>(); // Event to signal thread opening

  openThread() {
    this.openThreadEvent.emit(true); // Emit an event when the user opens the thread
  }

}

