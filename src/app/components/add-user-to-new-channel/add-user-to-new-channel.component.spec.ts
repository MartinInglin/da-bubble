import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddUserToNewChannelComponent } from './add-user-to-new-channel.component';

describe('AddUserToNewChannelComponent', () => {
  let component: AddUserToNewChannelComponent;
  let fixture: ComponentFixture<AddUserToNewChannelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddUserToNewChannelComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddUserToNewChannelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
