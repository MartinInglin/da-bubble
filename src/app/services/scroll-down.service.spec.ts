import { TestBed } from '@angular/core/testing';

import { ScrollDownService } from './scroll-down.service';

describe('ScrollDownService', () => {
  let service: ScrollDownService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ScrollDownService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
