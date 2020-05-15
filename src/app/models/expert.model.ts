import {WorkingHoursModel} from "./working-hours.model";

export interface ExpertModel {
  id: number;
  name: string;
  job_title: string;
  country_name: string;
  working_hours?: WorkingHoursModel;
}
