import {ChangeDetectorRef, Component, Injectable, OnInit, ViewChild} from '@angular/core';
import * as moment from 'moment-timezone';
import {MatCalendar} from "@angular/material/datepicker";
import {CalendarEvent, WeekViewHourSegment} from "calendar-utils";
import {CalendarEventTitleFormatter} from "angular-calendar";
import {fromEvent, zip} from "rxjs";
import {finalize, map, takeUntil} from "rxjs/operators";
import {addMinutes, endOfWeek} from 'date-fns';
import {ExpertsService} from "../../services/experts.service";
import {AppointmentsService} from "../../services/appointments.service";
import {ActivatedRoute} from "@angular/router";
import {AppointmentModel} from "../../models/appointment.model";
import {WorkingHoursModel} from "../../models/working-hours.model";
import {BookAppointmentModel} from "../../models/book-appointment.model";
import {MatSnackBar} from "@angular/material/snack-bar";
import {
  areSameDay,
  getNow,
  isAbsolutelyOlderInDays,
  isDateAfter,
  momentTzToDate,
  timeToMoment
} from "../../helpers/date_helper";
import {ceilToNearest} from "../../helpers/math_helper";

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
  selectedAppointment: CalendarEvent = null;
  expertId: number;
  name: string = '';
  isBooking: boolean = false

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

  get startHour() {
    let now = getNow(this.selectedTimezone);

    if (isAbsolutelyOlderInDays(this.viewDate, now)) {
      return this.maxDate.getHours();
    }

    if (areSameDay(this.viewDate, now) && this.minDate < now) {
      return now.getHours();
    }

    return this.minDate.getHours();
  }

  get startMinute() {
    let now = getNow(this.selectedTimezone);

    if (isAbsolutelyOlderInDays(this.viewDate, now)) {
      return 0;
    }

    if (areSameDay(this.viewDate, now) && this.minDate < now) {
      return now.getMinutes();
    }

    return this.minDate.getMinutes();
  }

  get endHour() {
    return this.maxDate.getHours();
  }

  get endMinute() {
    return this.maxDate.getMinutes();
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

    if (isDateAfter(this.minDate, start)) {
      return;
    }

    if (isDateAfter(start, this.maxDate)) {
      return;
    }

    if (this.selectedAppointment != null) {
      this.events.pop();
    }

    this.selectedAppointment = {
      id: this.events.length,
      title: this.name,
      start: start,
      end: addMinutes(start, this.precision),
      draggable: false,
      meta: {
        tmpEvent: true,
      },
    };

    this.events = [...this.events, this.selectedAppointment];

    const segmentPosition = segmentElement.getBoundingClientRect();
    this.dragToCreateActive = true;
    const endOfView = endOfWeek(this.viewDate, {
      weekStartsOn: this.weekStartsOn,
    });

    this.updateDraggedEvent(mouseDownEvent, segmentPosition, segment, endOfView, mouseDownEvent);

    fromEvent(document, 'mousemove')
      .pipe(
        finalize(() => {
          if (this.selectedAppointment != null && this.isOverlapping()) {
            this.stopDragging(mouseDownEvent);
          }

          delete this.selectedAppointment?.meta?.tmpEvent;
          this.dragToCreateActive = false;
          this.refresh();
        }),
        takeUntil(fromEvent(document, 'mouseup'))
      )
      .subscribe((mouseMoveEvent: MouseEvent) => {
        this.updateDraggedEvent(mouseMoveEvent, segmentPosition, segment, endOfView, mouseDownEvent);
      });
  }

  bookAppointment() {
    let london = moment(this.selectedAppointment.start).tz(this.selectedTimezone, true);
    let start = london.tz(moment.tz.guess());

    let appointment: BookAppointmentModel = {
      starts_at: start.toDate(),
      duration: moment(this.selectedAppointment.end).diff(moment(this.selectedAppointment.start), 'minutes'),
      user_name: this.name,
      expert_id: this.expertId,
    };

    if (this.selectedTimezone) {
      appointment.timezone = this.selectedTimezone;
    }

    this.isBooking = true;
    this.appointmentsService.book(appointment).subscribe((msg) => {
      this.error = null;
      this.isBooking = false;
      this._snackBar.open(msg.message, null, {
        duration: 5000,
      });

      this.loadData();
    }, (error) => {
      console.error(error);
      this.isBooking = false;
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
        this.selectedAppointment = null;

        this.workingHours = pair.workingHoursModel;
        this.events = pair.appointments;

        this.minDate = timeToMoment(this.workingHours.starts_at, this.selectedTimezone);
        this.maxDate = timeToMoment(this.workingHours.ends_at, this.selectedTimezone);

        this.isLoading = false;
      }, (error) => {
        this.error = error;
      });
  }

  canBook() {
    return this.selectedAppointment !== null && this.name != null && this.name.length > 6;
  }

  updateNameOfEvent() {
    if (!this.selectedAppointment) {
      return;
    }

    this.selectedAppointment.title = this.name;
  }

  private updateDraggedEvent(mouseMoveEvent: MouseEvent, segmentPosition: DOMRect, segment: WeekViewHourSegment, endOfView: Date, mouseDownEvent: MouseEvent) {
    let minutesDiff = ceilToNearest(
      (mouseMoveEvent.clientY - segmentPosition.top) / 2,
      this.precision
    );

    minutesDiff = Math.min(minutesDiff, 60);

    const newEnd = addMinutes(segment.date, minutesDiff);

    if (newEnd > segment.date && newEnd < endOfView) {
      this.selectedAppointment.end = newEnd;

      if (this.isOverlapping()) {
        this.stopDragging(mouseDownEvent);
        this.refresh();
        return;
      }
    }

    this.refresh();
  }

  private stopDragging(mouseDownEvent: MouseEvent) {
    this.events.pop();
    this.selectedAppointment = null;

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

    let draggedStart = this.selectedAppointment.start.getTime();
    let draggedEnd = this.selectedAppointment.end.getTime();

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

