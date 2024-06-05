import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChannelInfoEditComponent } from './channel-info-edit.component';

describe('ChannelInfoEditComponent', () => {
  let component: ChannelInfoEditComponent;
  let fixture: ComponentFixture<ChannelInfoEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChannelInfoEditComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChannelInfoEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
