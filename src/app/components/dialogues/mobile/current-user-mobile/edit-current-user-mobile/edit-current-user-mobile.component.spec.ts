import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditCurrentUserMobileComponent } from './edit-current-user-mobile.component';

describe('EditCurrentUserMobileComponent', () => {
  let component: EditCurrentUserMobileComponent;
  let fixture: ComponentFixture<EditCurrentUserMobileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditCurrentUserMobileComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EditCurrentUserMobileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
