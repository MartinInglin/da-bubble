import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  ViewChild,
  HostListener,
  inject,
  ChangeDetectorRef,
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
import { MatDialogModule } from '@angular/material/dialog';
import { StateService } from '../../services/stateservice.service';
import { SideNavComponent } from './side-nav/side-nav.component';
import { AuthService } from '../../services/auth.service';
import { ScrollDownService } from '../../services/scroll-down.service';

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
  styleUrls: ['./landing-page.component.scss'],
})
export class LandingPageComponent implements OnInit, OnDestroy {
  openThreadEvent: EventEmitter<boolean> = new EventEmitter<boolean>();

  @ViewChild('drawerThread') drawerThread!: MatDrawer;
  @ViewChild('drawer') drawer!: MatDrawer;
  @ViewChild(MainContentComponent) mainContentComponent!: MainContentComponent;
  @ViewChild(ThreadComponent) threadComponent!: ThreadComponent;

  authService = inject(AuthService);
  usersService = inject(UsersService);
  stateService = inject(StateService);
  scrollDownService = inject(ScrollDownService);

  private userSubscription: Subscription = new Subscription();
  private scrollSubscriptionChannel!: Subscription;
  private scrollSubscriptionDirectMessage!: Subscription;

  currentUser: User = new User();
  isOpen: boolean = false;
  isThreadOpen: boolean = false;
  isUnderWidth: boolean = false;

  menuOpen: string = 'Workspace-Menü öffnen';
  menuClosed: string = 'Workspace-Menü schliessen';
  menuUp: any = 'assets/images/icons/menu_up.svg';
  menuDown: any = 'assets/images/icons/menu_down.svg';

  constructor(private cdref: ChangeDetectorRef) {}

  /**
   * Initializes the component by subscribing to the currentUser$ observable
   * to get the current user data and checking the window width.
   */
  ngOnInit(): void {
    this.userSubscription = this.usersService.currentUser$.subscribe((user) => {
      if (user) {
        this.currentUser = user ?? new User();
      }
    });
    this.cdref.detectChanges();
    this.checkWidth();

    this.scrollSubscriptionChannel =
      this.scrollDownService.scrollDownChannel$.subscribe(() => {
        this.scrollToBottomChannel();
      });

    this.scrollSubscriptionDirectMessage =
      this.scrollDownService.scrollDownDirectMessage$.subscribe(() => {
        this.scrollToBottomDirectMessage();
      });
  }

  /**
   * Handles the window resize event.
   *
   * @param event - The resize event triggered when the window is resized.
   */
  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    this.checkWidth();
  }

  /**
   * Checks the current window width and sets the isUnderWidth property
   * based on whether the width is less than or equal to 1360 pixels.
   */
  checkWidth(): void {
    this.isUnderWidth = window.innerWidth <= 1360;
  }

  /**
   * This function opens and closes the side nav drawer.
   *
   * @param drawer sidenav
   */
  toggleSidenav(drawer: any): void {
    this.isOpen = !this.isOpen;
    if (drawer) {
      drawer.toggle();
    }
  }

  /**
   * This function opens a thread.
   */
  openThread() {
    this.isThreadOpen = true;
    this.drawerThread.open();
    this.threadComponent.callSetFocus();
    this.threadComponent.scrollToBottomThread();
  }

  /**
   * This function closes a thread.
   */
  closeThread() {
    this.isThreadOpen = false;
    if (this.drawerThread) {
      this.drawerThread.close();
    }
  }

  // Unsubscribe from userSubscription if exists
  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    if (this.scrollSubscriptionChannel) {
      this.scrollSubscriptionChannel.unsubscribe();
    }
    if (this.scrollSubscriptionDirectMessage) {
      this.scrollSubscriptionDirectMessage.unsubscribe();
    }
  }

  scrollToBottomChannel() {
    setTimeout(() => {
      this.mainContentComponent.scrollToBottomChannelMessageContent();
    }, 300);
  }

  scrollToBottomDirectMessage() {
    setTimeout(() => {
      this.mainContentComponent.scrollToBottomDirectMessageContent();
    }, 300);
  }
}
