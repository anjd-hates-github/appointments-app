import {Injectable} from '@angular/core';
import {ExpertModel} from "./models/expert.model";
import {HttpClient} from "@angular/common/http";
import {environment} from "../environments/environment";
import {Observable} from "rxjs";
import {ResponseModel} from "./models/response.model";
import {map, tap} from "rxjs/operators";
import {AppointmentModel} from "./models/appointment.model";
import {WorkingHoursModel} from "./models/working-hours.model";

@Injectable({
  providedIn: 'root'
})
export class ExpertsService {
  private readonly url: string;

  constructor(public client: HttpClient) {
    this.url = environment.apiUrl;
  }

  fetchExperts(): Observable<ExpertModel[]> {
    return this.client.get<ExpertModel[]>(`${this.url}/experts`);
  }

  fetchExpert(id: string): Observable<ExpertModel> {
    return this.client.get<ExpertModel>(`${this.url}/experts/${id}`);
  }

  fetchAppointments(id: number, timezone?: string): Observable<AppointmentModel[]> {
    let url = `${this.url}/experts/${id}/appointments`;

    if (timezone) {
      url += `?timezone=${timezone}`;
    }

    return this.client.get<AppointmentModel[]>(url);
  }

  fetchWorkingHours(id: number, timezone?: string): Observable<WorkingHoursModel> {
    let url = `${this.url}/experts/${id}/working-hours`;
    if (timezone) {
      url += `?timezone=${timezone}`;
    }

    return this.client.get<WorkingHoursModel>(url).pipe(
      tap((item) => {
        console.log(item);
      })
    );
  }

}
