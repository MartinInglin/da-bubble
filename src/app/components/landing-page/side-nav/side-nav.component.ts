import { CommonModule } from '@angular/common';
import {
  Component, EventEmitter, Input, OnInit, Output, inject, HostListener, ViewChild,
  ElementRef,
} from '@angular/core';
import { StateService } from '../../../services/stateservice.service';
import { NewChannelComponent } from '../../dialogues/new-channel/new-channel.component';
import { NewChannelMobileComponent } from '../../dialogues/mobile/new-channel-mobile/new-channel-mobile.component';
import { User } from '../../../models/user.class';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ChannelsService } from '../../../services/firestore/channels.service';
import { DirectMessagesService } from '../../../services/firestore/direct-messages.service';
import { UsersService } from '../../../services/firestore/users.service';
import { Observable, Subscription, debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { Channel } from '../../../models/channel.class';

@Component({
  selector: 'app-side-nav',
  standalone: true,
  imports: [CommonModule, NewChannelComponent, MatDialogModule, FormsModule,
    ReactiveFormsModule],
  templateUrl: './side-nav.component.html',
  styleUrl: './side-nav.component.scss',
})
export class SideNavComponent implements OnInit {
  usersService = inject(UsersService);
  stateService = inject(StateService);
  channelsService = inject(ChannelsService);
  directMessagesService = inject(DirectMessagesService);

  @Input() currentUser: User = new User();
  @Output() contactClicked = new EventEmitter<void>();
  @Output() toggleDrawer = new EventEmitter<void>();
  @Output() closeThread = new EventEmitter<void>();

  @ViewChild('searchResultsList') searchResultsList!: ElementRef;

  private allUsersSubscription: Subscription = new Subscription();
  private showContactsSubscription: Subscription = new Subscription();
  private showChannelsSubscription: Subscription = new Subscription();
  private sideNavSubscription: Subscription = new Subscription();

  form: FormGroup;
  searchTerm: string = '';
  searchResults$: Observable<(Channel | User)[]> = of([]);
  searchResults: (Channel | User)[] | undefined;
  allUsers: User[] = [];
  filteredUsers: User[] = [];
  filteredChannels: Channel[] = [];

  showContacts: boolean = false;
  showChannels: boolean = false;
  isDialogOpen: boolean = false;
  isSideNavOpen: boolean = true;
  isOpen: boolean = false;

  arrowOpen: any = '/assets/images/icons/arrow_drop_down.svg';
  arrowClosed: any = '/assets/images/icons/arrow_drop_right.svg';

  constructor(private dialog: MatDialog, private fb: FormBuilder,) {
    // Erstellen des Formulars mit einem einzelnen Eingabefeld 'recipient'
    this.form = this.fb.group({
      recipient: [''],
    });
  }

  ngOnInit(): void {
    // Abonnement zum Anzeigen der Kontakte
    this.stateService.showContacts$.subscribe((show) => {
      this.showContacts = show;
    });

    // Abonnement zum Anzeigen der Kanäle
    this.stateService.showChannels$.subscribe((show) => {
      this.showChannels = show;
    });

    // Abonnement zur Aktualisierung der Liste aller Benutzer
    this.allUsersSubscription = this.usersService.allUsersSubject$.subscribe(
      (users) => {
        if (users) {
          this.allUsers = users ?? [];

          // Filtern der Benutzer basierend auf dem Suchbegriff
          this.filteredUsers = this.allUsers.filter((u) =>
            u.name.toLowerCase().includes(this.searchTerm.toLowerCase())
          );


        }
      }
    );

    // Abonnement zur Verarbeitung von Formularänderungen
    this.searchResults$ = this.form.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((formValue) => {
        const term = formValue.recipient;
        this.searchTerm = typeof term === 'string' ? term : '';
        return this.searchTerm ? this.search(this.searchTerm) : of([]);
      })
    );

    this.searchResults$.subscribe((results) => {
      this.searchResults = results;
    });

    this.searchResults$.subscribe((results) => {
      this.searchResults = results;
    });

    this.sideNavSubscription = this.stateService.sideNavOpen$.subscribe((isOpen) => {
      this.isSideNavOpen = isOpen;
      if (isOpen) {
        this.stateService.closeThread();
      }
    });
  }

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: MouseEvent): void {
    if (this.searchResultsList && !this.searchResultsList.nativeElement.contains(event.target)) {
      this.closeSearchResults();
    }
  }

  closeSearchResults(): void {
    this.searchResults = [];
    this.form.get('recipient')?.setValue(''); // Clear the input field
  }

  // Getter für das Eingabefeld 'recipient'
  get recipient(): FormControl {
    return this.form.get('recipient') as FormControl;
  }

  // Funktion zur Überprüfung, ob ein Ergebnis ein Benutzer ist
  isUser(result: Channel | User): result is User {
    return (result as User).avatar !== undefined;
  }



  closeSideNav() {
    this.isOpen = false;
  }

  closeSidenavMobile() {
    this.toggleDrawer.emit();
    this.stateService.closeThread();
  }

  closeSidenavMobileAfterContacts() {
    this.toggleDrawer.emit();
    this.stateService.closeThread();
  }

  // Funktion zur Suche nach Kanälen oder Benutzern basierend auf dem Suchbegriff
  search(searchTerm: string): Observable<(Channel | User)[]> {
    // Suche nach Kanälen
    if (searchTerm.startsWith('#')) {
      const filteredChannels = this.filteredChannels.filter((channel) =>
        channel.name.toLowerCase().includes(searchTerm.slice(1).toLowerCase()) && !channel.isDirectMessage // Entfernen Sie "#" aus dem Suchbegriff
      );
      return of(filteredChannels);
    }
    // Suche nach Benutzern
    else if (searchTerm.startsWith('@')) {
      const filteredUsers = this.allUsers.filter((user) =>
        user.name.toLowerCase().includes(searchTerm.slice(1).toLowerCase()) && !user.isChannel // Entfernen Sie "@" aus dem Suchbegriff
      );
      return of(filteredUsers);
    }
    // Allgemeine Suche (ohne Präfix)
    else {
      const filteredChannels = this.filteredChannels.filter((channel) =>
        channel.name.toLowerCase().includes(searchTerm.toLowerCase()) && !channel.isDirectMessage
      );
      const filteredUsers = this.allUsers.filter((user) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) && !user.isChannel
      );

      // Zusammenführen der Suchergebnisse
      const results = [...filteredChannels, ...filteredUsers];
      return of(results);
    }
  }

  // Funktion zum Öffnen eines Kanals
  openChannel(x: string) {
    this.channelsService.getDataChannel(x);
    this.form.get('recipient')?.setValue('');
    if (this.isOpen) { // Check if sidenav is open
      this.toggleDrawer.emit();
      this.stateService.closeThread();
    }
  }

  openDirectMessage(x: string, y: any) {
    this.directMessagesService.getDataDirectMessage(x, y);
    this.form.get('recipient')?.setValue('');
    if (this.isOpen) { // Check if sidenav is open
      this.toggleDrawer.emit();
      this.stateService.closeThread();
    }
  }

  // Funktion zum Schließen der Kanal- und Kontaktansicht
  closeChannelsAndContacts() {
    this.stateService.setShowContacts(false);
    this.stateService.setShowChannels(false);
  }

  // Funktion zum Abrufen aller Benutzer
  async getAllUsers() {
    this.usersService.getAllUsers();
  }

  // Funktion zum Öffnen des Dialogs für einen neuen Kanal
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

  // Funktion zum Öffnen des mobilen Dialogs für einen neuen Kanal
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

  // Aufräumarbeiten bei der Zerstörung der Komponente
  ngOnDestroy(): void {
    if (this.allUsersSubscription) {
      this.allUsersSubscription.unsubscribe();
    }
    if (this.showChannelsSubscription) {
      this.showChannelsSubscription.unsubscribe();
    }
    if (this.showContactsSubscription) {
      this.showContactsSubscription.unsubscribe();
    }
    if (this.sideNavSubscription) {
      this.sideNavSubscription.unsubscribe();
    }
  }
}
