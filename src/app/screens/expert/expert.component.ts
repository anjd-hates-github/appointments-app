import {Component, OnInit} from '@angular/core';
import {ExpertModel} from "../../models/expert.model";
import {ActivatedRoute} from "@angular/router";
import {ExpertsService} from "../../services/experts.service";
import {timeStringToDate} from "../../helpers/date_helper";

@Component({
  selector: 'app-expert',
  templateUrl: './expert.component.html',
  styleUrls: ['./expert.component.scss']
})
export class ExpertComponent implements OnInit {
  public expert: ExpertModel;
  public isLoading: boolean = true;

  constructor(public route: ActivatedRoute, public expertsService: ExpertsService) {
  }

  public get startsAt() {
    return timeStringToDate(this.expert.working_hours.starts_at);
  }

  public get endsAt() {
    return timeStringToDate(this.expert.working_hours.ends_at);
  }

  ngOnInit(): void {
    this.isLoading = true;

    let id = this.route.snapshot.params['id'];
    this.expertsService.fetchExpert(id).subscribe((val) => {
      this.expert = val;
      this.isLoading = false;
    });
  }

}
