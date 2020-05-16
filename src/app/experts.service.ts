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
    return this.client.get<ResponseModel<ExpertModel>>(`${this.url}/experts/${id}`)
      .pipe(
        map(val => val.data)
      );
  }

  fetchAppointments(id: string): Observable<AppointmentModel[]> {
    return this.client.get<AppointmentModel[]>(`${this.url}/experts/${id}/appointments`);
  }

  fetchWorkingHours(id: string): Observable<WorkingHoursModel> {
    return this.client.get<WorkingHoursModel>(`${this.url}/experts/${id}/working-hours`).pipe(
      tap((item) => {console.log(item);})
    );
  }

}
