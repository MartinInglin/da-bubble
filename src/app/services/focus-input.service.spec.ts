import { TestBed } from '@angular/core/testing';

import { FocusInputService } from './focus-input.service';

describe('FocusInputService', () => {
  let service: FocusInputService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FocusInputService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
