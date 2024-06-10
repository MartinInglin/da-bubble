import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject } from '@angular/core';
import { StateService } from '../../../services/stateservice.service';
import { NewChannelComponent } from '../../dialogues/new-channel/new-channel.component';
import { NewChannelMobileComponent } from '../../dialogues/mobile/new-channel-mobile/new-channel-mobile.component';
import { User } from '../../../models/user.class';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ChannelsService } from '../../../services/firestore/channels.service';
import { DirectMessagesService } from '../../../services/firestore/direct-messages.service';
import { UsersService } from '../../../services/firestore/users.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-side-nav',
  standalone: true,
  imports: [CommonModule, NewChannelComponent, MatDialogModule],
  templateUrl: './side-nav.component.html',
  styleUrl: './side-nav.component.scss',
})
export class SideNavComponent {
  usersService = inject(UsersService);
  stateService = inject(StateService);
  channelsService = inject(ChannelsService);
  directMessagesService = inject(DirectMessagesService);

  @Input() currentUser: User = new User();

  private allUsersSubscription: Subscription = new Subscription();
  private showContactsSubscription: Subscription = new Subscription();
  private showChannelsSubscription: Subscription = new Subscription();

  allUsers: User[] = [];

  showContacts: boolean = false;
  showChannels: boolean = false;
  isDialogOpen: boolean = false;

  arrowOpen: any = '/assets/images/icons/arrow_drop_up.svg';
  arrowClosed: any = '/assets/images/icons/arrow_drop_down.svg';

  constructor(private dialog: MatDialog) { }

  ngOnInit(): void {
    this.stateService.showContacts$.subscribe((show) => {
      this.showContacts = show;
    });

    this.stateService.showChannels$.subscribe((show) => {
      this.showChannels = show;
    });

    this.allUsersSubscription = this.usersService.allUsersSubject$.subscribe(
      (allUsers) => {
        this.allUsers = allUsers ?? [];
      }
    );
  }

  closeChannelsAndContacts() {
    this.stateService.setShowContacts(false);
    this.stateService.setShowChannels(false);
  }

  async getAllUsers() {
    this.usersService.getAllUsers();
  }

  openNewChannelDialog(): void {
    if (this.currentUser) {
      if (window.innerWidth <= 750) {
        this.openMobileDialog();
      } else {
        const dialogRef = this.dialog.open(NewChannelComponent, {
          width: '872px',
          height: '539px',
        });
        dialogRef.componentInstance.currentUser = new User(this.currentUser);

        this.isDialogOpen = true;

        dialogRef.afterClosed().subscribe(() => {
          this.isDialogOpen = false;
        });
      }
    }
  }

  openMobileDialog(): void {
    if (this.currentUser) {
      const dialogRef = this.dialog.open(NewChannelMobileComponent, {
        width: '100%',
        height: '100vh',
      });
      dialogRef.componentInstance.currentUser = new User(this.currentUser);

      this.isDialogOpen = true;

      dialogRef.afterClosed().subscribe(() => {
        this.isDialogOpen = false;
      });
    }
  }

    ngOnDestroy(): void {
      if(this.allUsersSubscription) {
      this.allUsersSubscription.unsubscribe();
    }
    if (this.showChannelsSubscription) {
      this.showChannelsSubscription.unsubscribe();
    }
    if (this.showContactsSubscription) {
      this.showContactsSubscription.unsubscribe();
    }
  }
}
