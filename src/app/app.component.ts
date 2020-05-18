import {Component, OnInit} from '@angular/core';

declare var VANTA;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'Appointments App';

  ngOnInit(): void {
    // VANTA.HALO({
    //   el: "body",
    //   mouseControls: true,
    //   touchControls: true,
    //   minHeight: 200.00,
    //   minWidth: 200.00
    // });
  }
}
