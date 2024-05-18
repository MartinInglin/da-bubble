import { Component } from '@angular/core';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../shared/header/header.component';
import { ThreadComponent } from './thread/thread.component';
import { MainContentComponent } from './main-content/main-content.component';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [MatSidenavModule, MatButtonModule, CommonModule, HeaderComponent, ThreadComponent, MainContentComponent, MatIconModule,],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss'
})
export class LandingPageComponent {
  showContacts: boolean = false;
  showChannels: boolean = true;
  isOpen: boolean = false;
drawer: any;
  loading: boolean = true;
  allUsers: any = ['martin', 'tim', 'hallo', 'selam'];

  menuUp: any = './../../../assets/images/icons/add_circle.svg';
  menuDown: any = './../../../assets/images/icons/menu_down.svg';

  showContactsSide() { }

  toggle(){
    this.isOpen = !this.isOpen; // Hier wird der Wert von isOpen umgeschaltet
}


}
