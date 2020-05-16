import {Injectable} from '@angular/core';
import {AppointmentModel} from "../models/appointment.model";
import {environment} from "../../environments/environment";
import {ExpertModel} from "../models/expert.model";
import {HttpClient} from "@angular/common/http";
import {MessageModel} from "../models/message.model";
import {Observable} from "rxjs";
import {BookAppointmentModel} from "../models/book-appointment.model";

@Injectable({
  providedIn: 'root'
})
export class AppointmentsService {
  private readonly url: string;

  constructor(private client: HttpClient) {
    this.url = environment.apiUrl;
  }

  book(appointment: BookAppointmentModel): Observable<MessageModel> {
    return this.client.post<MessageModel>(`${this.url}/appointments`, appointment);
  }
}
