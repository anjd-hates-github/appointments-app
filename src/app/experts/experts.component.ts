import {Component, OnInit} from '@angular/core';
import {ExpertModel} from "../models/expert.model";
import {ExpertsService} from "../services/experts.service";
import {catchError} from "rxjs/operators";

@Component({
  selector: 'app-experts',
  templateUrl: './experts.component.html',
  styleUrls: ['./experts.component.scss']
})
export class ExpertsComponent implements OnInit {
  experts: ExpertModel[] = [];
  isLoading: boolean = true;

  constructor(public expertsService: ExpertsService) {
  }

  ngOnInit(): void {
    this.expertsService.fetchExperts().subscribe(val => {
      this.experts = val;
      this.isLoading = false;
    });
  }

}
