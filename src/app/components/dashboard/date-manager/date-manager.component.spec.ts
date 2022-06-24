import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DateManagerComponent } from './date-manager.component';

describe('DateManagerComponent', () => {
  let component: DateManagerComponent;
  let fixture: ComponentFixture<DateManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DateManagerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DateManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
