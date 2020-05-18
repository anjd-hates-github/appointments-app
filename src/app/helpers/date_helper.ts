import * as moment from "moment";
import {Moment} from "moment-timezone/moment-timezone";

export function timeStringToDate(time: string) {
  return moment(time, 'HH:mm:ss').toDate();
}

export function isAbsolutelyOlderInDays(date1: Date, date2: Date) {
  return date1.getDate() < date2.getDate() && date1.getFullYear() <= date2.getFullYear() && date1.getMonth() <= date2.getMonth();
}

export function areSameDay(date1: Date, date2: Date) {
  return date1.getDate() == date2.getDate() && date1.getMonth() == date2.getMonth() && date1.getFullYear() == date2.getFullYear();
}


export function momentTzToDate(moment: Moment) {
  return new Date(moment.year(), moment.month(), moment.date(), moment.hours(), moment.minutes(), moment.seconds(), moment.milliseconds());
}


export function isDateAfter(date1: Date, date2: Date) {
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


export function timeToMoment(time: string, timezone: string) {
  let day = moment().tz(timezone);

  let splitTime = time.split(/:/)
  day.hours(parseInt(splitTime[0])).minutes(parseInt(splitTime[1])).seconds(parseInt(splitTime[2])).milliseconds(0);

  return momentTzToDate(day);
}


export function getNow(timezone: string) {
  return momentTzToDate(moment().tz(timezone));
}
