import {AfterViewInit, ChangeDetectorRef, Component, Injectable, OnInit, ViewChild} from '@angular/core';
import * as moment from 'moment-timezone';
import {MatCalendar} from "@angular/material/datepicker";
import {CalendarEvent} from "calendar-utils";
import {CalendarEventTitleFormatter} from "angular-calendar";
import {WeekViewHourSegment} from 'calendar-utils';
import {combineLatest, fromEvent, Observable, Subject} from "rxjs";
import {filter, finalize, switchAll, takeUntil} from "rxjs/operators";
import {addDays, addMinutes, endOfWeek} from 'date-fns';

interface Duration {
  value: number;
  name: string;
}

function floorToNearest(amount: number, precision: number) {
  return Math.floor(amount / precision) * precision;
}

function ceilToNearest(amount: number, precision: number) {
  return Math.ceil(amount / precision) * precision;
}

@Injectable()
export class CustomEventTitleFormatter extends CalendarEventTitleFormatter {
  weekTooltip(event: CalendarEvent, title: string) {
    if (!event.meta.tmpEvent) {
      return super.weekTooltip(event, title);
    }
  }

  dayTooltip(event: CalendarEvent, title: string) {
    if (!event.meta.tmpEvent) {
      return super.dayTooltip(event, title);
    }
  }
}

@Component({
  selector: 'app-book',
  templateUrl: './book.component.html',
  styleUrls: ['./book.component.scss'],
  providers: [
    {
      provide: CalendarEventTitleFormatter,
      useClass: CustomEventTitleFormatter,
    },
  ],
})
export class BookComponent implements OnInit, AfterViewInit {

  isLoading: boolean = true;
  precision = 15;

  @ViewChild('calender') calender: MatCalendar<Date>;

  timezones = [];
  selected: moment.Moment;
  now: Date;
  durations: Duration[] = [
    {
      value: 15,
      name: "15 minutes"
    },
    {
      value: 30,
      name: "30 minutes"
    },
    {
      value: 45,
      name: "45 minutes"
    },
    {
      value: 60,
      name: "1 hours"
    },
  ];
  viewDate = new Date();

  dragToCreateActive = false;

  weekStartsOn: 0 = 0;

  fromDate: Date;
  toDate: Date;
  selectedTimezone: string;
  events: CalendarEvent[] = [];
  dragToSelectEvent: CalendarEvent = null;

  constructor(private cdr: ChangeDetectorRef) {
    this.now = moment().toDate();
  }

  timezoneChanged(val: string) {
    this.selectedTimezone = val;
  }

  selectedChanged($event) {
    let date = moment($event);
    console.log(date.date());
  }

  ngOnInit(): void {
    this.timezones = moment.tz.names();
  }

  ngAfterViewInit(): void {
    // this.calender.currentView = 'year';
  }


  startDragToCreate(
    segment: WeekViewHourSegment,
    mouseDownEvent: MouseEvent,
    segmentElement: HTMLElement
  ) {

    if (this.dragToSelectEvent != null) {
      this.events.splice(this.events.length - 1, 1);
    }

    this.dragToSelectEvent = {
      id: this.events.length,
      title: 'New event',
      start: segment.date,
      draggable: false,
      meta: {
        tmpEvent: true,
      },
    };

    this.events = [...this.events, this.dragToSelectEvent];

    const segmentPosition = segmentElement.getBoundingClientRect();
    this.dragToCreateActive = true;
    const endOfView = endOfWeek(this.viewDate, {
      weekStartsOn: this.weekStartsOn,
    });

    fromEvent(document, 'mousemove')
      .pipe(
        finalize(() => {
          delete this.dragToSelectEvent.meta.tmpEvent;
          this.dragToCreateActive = false;
          this.refresh();
        }),
        takeUntil(fromEvent(document, 'mouseup'))
      )
      .subscribe((mouseMoveEvent: MouseEvent) => {

        let minutesDiff = ceilToNearest(
          (mouseMoveEvent.clientY - segmentPosition.top) / 2,
          this.precision
        );

        minutesDiff = Math.min(minutesDiff, 60);

        const newEnd = addMinutes(segment.date, minutesDiff);

        if (newEnd > segment.date && newEnd < endOfView) {
          this.dragToSelectEvent.end = newEnd;

          if (this.overlap()) {
            this.stopDragging(mouseDownEvent);
            this.refresh();
            return;
          }
        }

        this.refresh();
      });
  }

  private isDraggingToDifferentDay() {
    return this.dragToSelectEvent.end.getDate() != this.dragToSelectEvent.start.getDate();
  }

  private stopDragging(mouseDownEvent: MouseEvent) {
    this.events.splice(this.events.length - 1, 1);

    mouseDownEvent.target.dispatchEvent(
      new MouseEvent('mouseup', {
          view: window,
          bubbles: true,
          cancelable: true
        }
      )
    );
  }

  private overlap() {
    let filteredEvents = this.events.slice(0, -1);
    // let filteredEvents = this.events.filter((event) => event != this.dragToSelectEvent);

    let draggedStart = this.dragToSelectEvent.start.getTime();
    let draggedEnd = this.dragToSelectEvent.end.getTime();

    return filteredEvents
      .filter(
        (event) => {
          let start = event.start.getTime();
          return start >= draggedStart && start <= draggedEnd
        }
      ).length > 0;
  }

  private refresh() {
    this.events = [...this.events];
    this.cdr.detectChanges();
  }
}
