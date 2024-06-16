import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChannelInfoEditMobileComponent } from './channel-info-edit-mobile.component';

describe('ChannelInfoEditMobileComponent', () => {
  let component: ChannelInfoEditMobileComponent;
  let fixture: ComponentFixture<ChannelInfoEditMobileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChannelInfoEditMobileComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChannelInfoEditMobileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
