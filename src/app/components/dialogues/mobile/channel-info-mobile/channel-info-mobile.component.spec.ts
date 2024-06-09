import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChannelInfoMobileComponent } from './channel-info-mobile.component';

describe('ChannelInfoMobileComponent', () => {
  let component: ChannelInfoMobileComponent;
  let fixture: ComponentFixture<ChannelInfoMobileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChannelInfoMobileComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChannelInfoMobileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
