import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../shared/header/header.component';
import { ThreadComponent } from './thread/thread.component';
import { MainContentComponent } from './main-content/main-content.component';
import { MatIconModule } from '@angular/material/icon';
import { User } from '../../models/user.class';
import { Subscription } from 'rxjs';
import { UsersService } from '../../services/firestore/users.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { StateService } from '../../services/stateservice.service';
import { SideNavComponent } from './side-nav/side-nav.component';

@Component({
  selector: 'app-landing-page',
  standalone: true,

  imports: [
    MatSidenavModule,
    MatButtonModule,
    CommonModule,
    ThreadComponent,
    MainContentComponent,
    MatIconModule,
    HeaderComponent,
    MatDialogModule,
    SideNavComponent,
  ],

  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss',
})
export class LandingPageComponent implements OnInit, OnDestroy {
  openThreadEvent: EventEmitter<boolean> = new EventEmitter<boolean>();

  @ViewChild('drawerThread') drawerThread!: MatDrawer;

  usersService = inject(UsersService);
  stateService = inject(StateService);

  private userSubscription: Subscription = new Subscription();

  currentUser: User = new User();
  i: any = ([] = '');

  isOpen: boolean = false;
  drawer: any;
  loading: boolean = true;
  isThreadOpen: boolean = false;

  users: any = [];
  menuOpen: string = 'Workspace-Menü öffnen';
  menuClosed: string = 'Workspace-Menü schliessen';
  menuUp: any = '/assets/images/icons/menu_up.svg';
  menuDown: any = '/assets/images/icons/menu_down.svg';

  constructor(private dialog: MatDialog) {}

  ngOnInit(): void {
    this.userSubscription = this.usersService.currentUser$.subscribe((user) => {
      if (user) {
        this.currentUser = user ?? new User();
        console.log('Current User:', this.currentUser);
      }
    });
  }

  toggle(drawer: any): void {
    this.isOpen = !this.isOpen;
    if (drawer) {
      drawer.toggle();
    }
  }

  openThread() {
    this.drawerThread.open();
  }

  closeThread() {
    this.drawerThread.close();
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }
}
