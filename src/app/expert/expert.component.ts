import {Component, Input, OnInit} from '@angular/core';
import {ExpertModel} from "../models/expert.model";
import {ActivatedRoute, RouterStateSnapshot} from "@angular/router";
import {ArgumentOutOfRangeError} from "rxjs";
import {ExpertsService} from "../experts.service";
import {map} from "rxjs/operators";

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

  ngOnInit(): void {
    this.isLoading = true;
    let id = this.route.snapshot.paramMap.get('id');
    this.expertsService.fetchExpert(id).subscribe((val) => {
      this.expert = val;
      console.log(this.expert);
      this.isLoading = false;
    });
  }

}
