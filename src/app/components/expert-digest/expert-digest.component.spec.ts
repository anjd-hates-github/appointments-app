import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpertDigestComponent } from './expert-digest.component';

describe('ExpertDigestComponent', () => {
  let component: ExpertDigestComponent;
  let fixture: ComponentFixture<ExpertDigestComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExpertDigestComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExpertDigestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
