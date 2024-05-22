import { CommonModule } from '@angular/common';
import { Component, Input, EventEmitter, OnInit} from '@angular/core';



@Component({
  selector: 'app-thread',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './thread.component.html',
  styleUrl: './thread.component.scss'
})
export class ThreadComponent implements OnInit {

comments: boolean = true;

@Input() openThreadEvent: EventEmitter<boolean> = new EventEmitter<boolean>();

ngOnInit() {

  // this.openThreadEvent.subscribe(() => { // Abonnieren des Ereignisses beim Initialisieren der Komponente
    // this.openThread();

 
}
 
openThread(){
  // this.openThreadEvent.subscribe(() => { // Subscribe on component initialization
    this.comments = true;
    console.log('thread öffnet sich');
    
  ;
}


}
