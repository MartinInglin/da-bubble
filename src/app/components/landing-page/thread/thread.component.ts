import { CommonModule } from '@angular/common';
import { Component, Input, EventEmitter} from '@angular/core';



@Component({
  selector: 'app-thread',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './thread.component.html',
  styleUrl: './thread.component.scss'
})
export class ThreadComponent {

comments: boolean = false;

@Input() openThreadEvent: EventEmitter<void> = new EventEmitter<void>();

ngOnInit() {

  
 
}
 
openThread(){
  this.openThreadEvent.subscribe(() => { // Subscribe on component initialization
    this.comments = true;
  });
}


}
