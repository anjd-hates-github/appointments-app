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

    VANTA.WAVES({
      el: "body",
      mouseControls: true,
      touchControls: true,
      minHeight: 200.00,
      minWidth: 200.00,
      scale: 1.00,
      scaleMobile: 1.00,
      color: 0xFFFFFF,
      shininess: 59.00,
      waveHeight: 26.50,
      waveSpeed: 0.60,
      zoom: 0.71
    })
  }
}
