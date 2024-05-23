import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditCurrentUserComponent } from './edit-current-user.component';

describe('EditCurrentUserComponent', () => {
  let component: EditCurrentUserComponent;
  let fixture: ComponentFixture<EditCurrentUserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditCurrentUserComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EditCurrentUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
