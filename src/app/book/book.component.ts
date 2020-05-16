import {AfterViewInit, ChangeDetectorRef, Component, Injectable, OnInit, ViewChild} from '@angular/core';
import * as moment from 'moment-timezone';
import {MatCalendar} from "@angular/material/datepicker";
import {CalendarEvent, WeekViewHourSegment} from "calendar-utils";
import {CalendarEventTitleFormatter} from "angular-calendar";
import {fromEvent, zip} from "rxjs";
import {finalize, map, takeUntil} from "rxjs/operators";
import {addMinutes, endOfWeek} from 'date-fns';
import {ExpertsService} from "../experts.service";
import {AppointmentsService} from "../appointments.service";
import {ActivatedRoute} from "@angular/router";
import {AppointmentModel} from "../models/appointment.model";
import {WorkingHoursModel} from "../models/working-hours.model";

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

  minDate: Date;
  maxDate: Date;
  selectedTimezone: string;
  events: CalendarEvent[] = [];
  workingHours: WorkingHoursModel = null;
  dragToSelectEvent: CalendarEvent = null;
  isPrevDisabled: boolean = true;


  constructor(
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private expertsService: ExpertsService,
    private appointmentsService: AppointmentsService
  ) {
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


    this.isLoading = true;
    let id = this.route.snapshot.params['id'];

    let fetchingWorkingHours$ = this.expertsService.fetchWorkingHours(id);
    let fetchingAppointments$ = this.expertsService.fetchAppointments(id).pipe(
      map((appointments: AppointmentModel[]): CalendarEvent[] => {
        return appointments.map((appointment: AppointmentModel): CalendarEvent => {
          return {
            title: appointment.user_name,
            start: new Date(appointment.starts_at),
            end: new Date(appointment.ends_at),
            color: {
              primary: "#d4cdcd",
              secondary: "#f1f1f1",
            },
            draggable: false,
            allDay: false,
            id: appointment.id,
            resizable: {
              beforeStart: false,
              afterEnd: false,
            },
            meta: {
              perSet: true,
            }
          };
        });
      })
    );
    zip(
      fetchingWorkingHours$,
      fetchingAppointments$,
      (workingHoursModel, appointments) => ({workingHoursModel, appointments})
    ).subscribe((pair) => {

      this.workingHours = pair.workingHoursModel;
      console.log(this.workingHours);

      this.events = pair.appointments;

      this.minDate = timeToMoment(this.workingHours.starts_at).toDate();
      this.maxDate = timeToMoment(this.workingHours.ends_at).toDate();

      this.isLoading = false;
    });

  }

  ngAfterViewInit(): void {
    // this.calender.currentView = 'year';
  }


  startDragToCreate(
    segment: WeekViewHourSegment,
    mouseDownEvent: MouseEvent,
    segmentElement: HTMLElement
  ) {
    if (isAfter(this.minDate, segment.date)) {
      return;
    }

    if (isAfter(segment.date, this.maxDate)) {
      return;
    }

    if (this.dragToSelectEvent != null) {
      this.events.pop();
    }

    this.dragToSelectEvent = {
      id: this.events.length,
      title: 'New event',
      start: segment.date,
      end: addMinutes(segment.date, this.precision),
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

    this.updateDraggedEvent(mouseDownEvent, segmentPosition, segment, endOfView, mouseDownEvent);

    fromEvent(document, 'mousemove')
      .pipe(
        finalize(() => {
          if (this.dragToSelectEvent != null && this.isOverlapping()) {
            this.stopDragging(mouseDownEvent);
          }

          delete this.dragToSelectEvent?.meta?.tmpEvent;
          this.dragToCreateActive = false;
          this.refresh();
        }),
        takeUntil(fromEvent(document, 'mouseup'))
      )
      .subscribe((mouseMoveEvent: MouseEvent) => {
        this.updateDraggedEvent(mouseMoveEvent, segmentPosition, segment, endOfView, mouseDownEvent);
      });
  }

  getStartHour() {
    let today = moment().toDate();

    if (areDatesEqual(this.viewDate, today)) {
      return today.getHours();
    }

    if (this.viewDate < today) {
      return 0;
    }

    return this.minDate.getHours();
  }

  getStartMinute() {
    let today = moment().toDate();

    if (areDatesEqual(this.viewDate, today)) {
      return today.getMinutes();
    }

    if (this.viewDate < today) {
      return 0;
    }

    return this.minDate.getMinutes();
  }

  getEndHour() {
    let today = moment().toDate();

    if (areDatesEqual(this.viewDate, today)) {
      return this.maxDate.getHours();
    }

    if (this.viewDate < today) {
      return 0;
    }

    return this.maxDate.getHours();
  }

  getEndMinute() {
    let today = moment().toDate();

    if (areDatesEqual(this.viewDate, today)) {
      return this.maxDate.getMinutes();
    }

    if (this.viewDate < today) {
      return 0;
    }

    return this.maxDate.getMinutes();
  }

  private updateDraggedEvent(mouseMoveEvent: MouseEvent, segmentPosition: DOMRect, segment: WeekViewHourSegment, endOfView: Date, mouseDownEvent: MouseEvent) {
    let minutesDiff = ceilToNearest(
      (mouseMoveEvent.clientY - segmentPosition.top) / 2,
      this.precision
    );

    minutesDiff = Math.min(minutesDiff, 60);

    const newEnd = addMinutes(segment.date, minutesDiff);

    if (newEnd > segment.date && newEnd < endOfView) {
      this.dragToSelectEvent.end = newEnd;

      if (this.isOverlapping()) {
        this.stopDragging(mouseDownEvent);
        this.refresh();
        return;
      }
    }

    this.refresh();
  }

  private isDraggingToDifferentDay() {
    return this.dragToSelectEvent.end.getDate() != this.dragToSelectEvent.start.getDate();
  }

  private stopDragging(mouseDownEvent: MouseEvent) {
    this.events.pop();
    this.dragToSelectEvent = null;

    mouseDownEvent.target.dispatchEvent(
      new MouseEvent('mouseup', {
          view: window,
          bubbles: true,
          cancelable: true
        }
      )
    );
  }

  private isOverlapping() {
    let filteredEvents = [...this.events];
    filteredEvents.pop();

    let draggedStart = this.dragToSelectEvent.start.getTime();
    let draggedEnd = this.dragToSelectEvent.end.getTime();

    return filteredEvents
      .filter(
        (event) => {
          let start = event.start.getTime();
          let end = event.end.getTime();
          return (start > draggedStart && start < draggedEnd) || (start < draggedStart && draggedStart < end)
        }
      ).length > 0;
  }

  private refresh() {
    this.events = [...this.events];
    this.cdr.detectChanges();
  }
}


function timeToMoment(time: string) {
  let day = moment().tz('GMT');
  let splitTime = time.split(/:/)
  day.hours(parseInt(splitTime[0])).minutes(parseInt(splitTime[1])).seconds(parseInt(splitTime[2])).milliseconds(0);


  return day;
}

function isAfter(date1: Date, date2: Date) {
  if (date1.getHours() > date2.getHours()) {
    return true;
  }

  if (date1.getHours() < date2.getHours()) {
    return false;
  }

  if (date1.getMinutes() > date2.getMinutes()) {
    return true;
  }

  if (date1.getMinutes() < date2.getMinutes()) {
    return false;
  }

  return date1.getSeconds() > date2.getSeconds();
}

function areDatesEqual(date1: Date, date2: Date) {
  return date1.getDay() === date2.getDay() && date1.getMonth() == date2.getMonth() && date1.getFullYear() === date2.getFullYear();
}
