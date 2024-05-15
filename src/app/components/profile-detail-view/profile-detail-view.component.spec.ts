import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileDetailViewComponent } from './profile-detail-view.component';

describe('ProfileDetailViewComponent', () => {
  let component: ProfileDetailViewComponent;
  let fixture: ComponentFixture<ProfileDetailViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileDetailViewComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProfileDetailViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
