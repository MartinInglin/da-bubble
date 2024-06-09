import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CurrentUserMobileComponent } from './current-user-mobile.component';

describe('CurrentUserMobileComponent', () => {
  let component: CurrentUserMobileComponent;
  let fixture: ComponentFixture<CurrentUserMobileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CurrentUserMobileComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CurrentUserMobileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
