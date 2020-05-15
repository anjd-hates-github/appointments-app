import {Component, Input, OnInit} from '@angular/core';
import {ExpertModel} from "../models/expert.model";

@Component({
  selector: 'app-expert-digest',
  templateUrl: './expert-digest.component.html',
  styleUrls: ['./expert-digest.component.scss']
})
export class ExpertDigestComponent implements OnInit {
  @Input() expert: ExpertModel;

  constructor() { }

  ngOnInit(): void {
    console.log(this.expert);
  }

}
