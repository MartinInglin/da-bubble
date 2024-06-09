import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewChannelMobileComponent } from './new-channel-mobile.component';

describe('NewChannelMobileComponent', () => {
  let component: NewChannelMobileComponent;
  let fixture: ComponentFixture<NewChannelMobileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewChannelMobileComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(NewChannelMobileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
