import {ChangeDetectorRef, Component, Injectable, OnInit, ViewChild} from '@angular/core';
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
import {BookAppointmentModel} from "../models/book-appointment.model";
import {MatSnackBar} from "@angular/material/snack-bar";
import {Moment} from "moment-timezone/moment-timezone";

moment.tz.link('Europe/London');

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
export class BookComponent implements OnInit {

  isLoading: boolean = true;
  precision = 15;

  @ViewChild('calender') calender: MatCalendar<Date>;

  timezones = [];
  now: Date;
  viewDate: Date;

  dragToCreateActive = false;

  weekStartsOn: 0 = 0;

  error: string = null;

  minDate: Date;
  maxDate: Date;
  selectedTimezone: string;
  // selectedTimezone: string = 'Europe/London';
  events: CalendarEvent[] = [];
  workingHours: WorkingHoursModel = null;
  dragToSelectEvent: CalendarEvent = null;
  expertId: number;
  name: string = '';

  constructor(
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private expertsService: ExpertsService,
    private appointmentsService: AppointmentsService,
    private _snackBar: MatSnackBar) {

    this.selectedTimezone = moment.tz.guess();
    this.now = momentTzToDate(moment().tz(this.selectedTimezone));
    this.viewDate = momentTzToDate(moment().tz(this.selectedTimezone));
  }

  timezoneChanged(val: string) {
    this.selectedTimezone = val;
    this.now = momentTzToDate(moment().tz(this.selectedTimezone));
    this.viewDate = momentTzToDate(moment().tz(this.selectedTimezone));

    this.loadData();
  }

  ngOnInit(): void {
    this.timezones = moment.tz.names();
    this.expertId = this.route.snapshot.params['id'];

    this.loadData();
  }

  startDragToCreate(
    segment: WeekViewHourSegment,
    mouseDownEvent: MouseEvent,
    segmentElement: HTMLElement
  ) {
    let start = segment.date;

    if (isAfter(this.minDate, start)) {
      return;
    }

    if (isAfter(start, this.maxDate)) {
      return;
    }

    if (this.dragToSelectEvent != null) {
      this.events.pop();
    }

    this.dragToSelectEvent = {
      id: this.events.length,
      title: this.name,
      start: start,
      end: addMinutes(start, this.precision),
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
    let now = this.getNow();


    if (areDatesEqual(this.viewDate, now)) {
      return now.getHours();
    }

    if (this.viewDate < now) {
      return 0;
    }

    return this.minDate.getHours();
  }

  getStartMinute() {
    let today = this.getNow();

    if (areDatesEqual(this.viewDate, today)) {
      return today.getMinutes();
    }

    if (this.viewDate < today) {
      return 0;
    }

    return this.minDate.getMinutes();
  }

  getEndHour() {
    let today = this.getNow();

    if (areDatesEqual(this.viewDate, today)) {
      return this.maxDate.getHours();
    }

    if (this.viewDate < today) {
      return 0;
    }

    return this.maxDate.getHours();
  }

  getEndMinute() {
    let today = this.getNow();

    if (areDatesEqual(this.viewDate, today)) {
      return this.maxDate.getMinutes();
    }

    if (this.viewDate < today) {
      return 0;
    }

    return this.maxDate.getMinutes();
  }

  bookAppointment() {
    let london = moment(this.dragToSelectEvent.start).tz(this.selectedTimezone, true);
    let start = london.tz(moment.tz.guess());

    let appointment: BookAppointmentModel = {
      starts_at: start.toDate(),
      duration: moment(this.dragToSelectEvent.end).diff(moment(this.dragToSelectEvent.start), 'minutes'),
      user_name: this.name,
      expert_id: this.expertId,
    };

    if (this.selectedTimezone) {
      appointment.timezone = this.selectedTimezone;
    }

    this.appointmentsService.book(appointment).subscribe((msg) => {
      this._snackBar.open(msg.message, null, {
        duration: 5000,
      });

      this.loadData();
    }, (error) => {
      console.error(error);
      this.error = error.error.message;
    });
  }

  loadData() {
    this.isLoading = true;
    let fetchingWorkingHours$ = this.expertsService.fetchWorkingHours(this.expertId, this.selectedTimezone);
    let fetchingAppointments$ = this.expertsService.fetchAppointments(this.expertId, this.selectedTimezone).pipe(
      map((appointments: AppointmentModel[]): CalendarEvent[] => {
        return appointments.map((appointment: AppointmentModel): CalendarEvent => {
          let start = momentTzToDate(moment(appointment.starts_at));
          let end = momentTzToDate(moment(appointment.ends_at));

          console.log(appointment.starts_at);
          console.log(start);

          return {
            title: appointment.user_name,
            start: start,
            end: end,
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
    )
      .subscribe((pair) => {

        this.workingHours = pair.workingHoursModel;
        this.events = pair.appointments;

        this.minDate = this.timeToMoment(this.workingHours.starts_at);
        this.maxDate = this.timeToMoment(this.workingHours.ends_at);

        this.isLoading = false;
      }, (error) => {
        this.error = error;
      });
  }

  timeToMoment(time: string) {
    let day = moment().tz(this.selectedTimezone);

    let splitTime = time.split(/:/)
    day.hours(parseInt(splitTime[0])).minutes(parseInt(splitTime[1])).seconds(parseInt(splitTime[2])).milliseconds(0);

    return momentTzToDate(day);
  }

  canBook() {
    return this.dragToSelectEvent !== null && this.name != null && this.name.length > 6;
  }

  updateNameOfEvent() {
    if (!this.dragToSelectEvent) {
      return;
    }

    this.dragToSelectEvent.title = this.name;
  }

  private getNow() {
    return momentTzToDate(moment().tz(this.selectedTimezone));
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

function momentTzToDate(moment: Moment) {
  return new Date(moment.year(), moment.month(), moment.date(), moment.hours(), moment.minutes(), moment.seconds(), moment.milliseconds());
}
