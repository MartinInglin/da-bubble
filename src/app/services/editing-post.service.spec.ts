import { TestBed } from '@angular/core/testing';

import { EditingPostService } from './editing-post.service';

describe('EditingPostService', () => {
  let service: EditingPostService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EditingPostService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
