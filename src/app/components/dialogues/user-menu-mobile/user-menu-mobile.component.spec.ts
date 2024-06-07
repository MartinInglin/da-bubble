import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserMenuMobileComponent } from './user-menu-mobile.component';

describe('UserMenuMobileComponent', () => {
  let component: UserMenuMobileComponent;
  let fixture: ComponentFixture<UserMenuMobileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserMenuMobileComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UserMenuMobileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
