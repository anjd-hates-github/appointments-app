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
  stopped: Subject<boolean> = new Subject<boolean>();

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
    const dragToSelectEvent: CalendarEvent = {
      id: this.events.length,
      title: 'New event',
      start: segment.date,
      draggable: true,
      meta: {
        tmpEvent: true,
      },
    };

    this.events = [...this.events, dragToSelectEvent];

    const segmentPosition = segmentElement.getBoundingClientRect();
    this.dragToCreateActive = true;
    const endOfView = endOfWeek(this.viewDate, {
      weekStartsOn: this.weekStartsOn,
    });

    fromEvent(document, 'mousemove')
      .pipe(
        finalize(() => {
          delete dragToSelectEvent.meta.tmpEvent;
          this.dragToCreateActive = false;
          this.refresh();
        }),
        takeUntil(fromEvent(document, 'mouseup'))
      )
      .subscribe((mouseMoveEvent: MouseEvent) => {

        console.log('seeeeeeeeee');
        const minutesDiff = ceilToNearest(
          mouseMoveEvent.clientY - segmentPosition.top,
          30
        );

        const daysDiff =
          floorToNearest(
            mouseMoveEvent.clientX - segmentPosition.left,
            segmentPosition.width
          ) / segmentPosition.width;

        const newEnd = addDays(addMinutes(segment.date, minutesDiff), daysDiff);
        if (newEnd > segment.date && newEnd < endOfView) {
          dragToSelectEvent.end = newEnd;

          if (this.overlap(dragToSelectEvent)) {
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
        }
        this.refresh();
      });
  }

  private overlap(dragToSelectEvent: CalendarEvent) {
    let filteredEvents = this.events.filter((event) => event != dragToSelectEvent);

    return filteredEvents
      .filter(
        (event) =>
          event.start.getTime() >= dragToSelectEvent.start.getTime() && event.start.getTime() <= dragToSelectEvent.end.getTime()
      ).length > 0;
  }

  private refresh() {
    this.events = [...this.events];
    this.cdr.detectChanges();
  }
}
