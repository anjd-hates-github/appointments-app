import {Injectable} from '@angular/core';
import {ExpertModel} from "./models/expert.model";
import {HttpClient} from "@angular/common/http";
import {environment} from "../environments/environment";
import {Observable} from "rxjs";
import {ResponseModel} from "./models/response.model";
import {map} from "rxjs/operators";

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
}
