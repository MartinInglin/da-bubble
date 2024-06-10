import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddUserToNewChannelMobileComponent } from './add-user-to-new-channel-mobile.component';

describe('AddUserToNewChannelMobileComponent', () => {
  let component: AddUserToNewChannelMobileComponent;
  let fixture: ComponentFixture<AddUserToNewChannelMobileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddUserToNewChannelMobileComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddUserToNewChannelMobileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
