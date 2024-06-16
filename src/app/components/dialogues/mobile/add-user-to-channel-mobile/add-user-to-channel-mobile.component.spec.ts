import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddUserToChannelMobileComponent } from './add-user-to-channel-mobile.component';

describe('AddUserToChannelMobileComponent', () => {
  let component: AddUserToChannelMobileComponent;
  let fixture: ComponentFixture<AddUserToChannelMobileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddUserToChannelMobileComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddUserToChannelMobileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
