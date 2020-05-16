import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {ExpertsComponent} from './experts/experts.component';
import {ExpertComponent} from './expert/expert.component';
import {MatGridListModule} from "@angular/material/grid-list";
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {BookComponent} from './book/book.component';
import {ExpertDigestComponent} from './expert-digest/expert-digest.component';
import {HttpClientModule} from "@angular/common/http";
import {MatCardModule} from "@angular/material/card";
import {MatButtonModule} from "@angular/material/button";
import {MatSelectModule} from "@angular/material/select";
import {MatDatepickerModule} from "@angular/material/datepicker";
import {MAT_DATE_LOCALE, MatNativeDateModule} from '@angular/material/core';
import {LayoutModule} from "@angular/cdk/layout";
import {FlexLayoutModule} from '@angular/flex-layout';
import { CalendarModule, DateAdapter } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/moment';
import * as moment from 'moment';
import {MatSnackBarModule} from "@angular/material/snack-bar";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInput, MatInputModule} from "@angular/material/input";
import {FormsModule} from "@angular/forms";

export function momentAdapterFactory() {
  return adapterFactory(moment);
};

@NgModule({
  declarations: [
    AppComponent,
    ExpertsComponent,
    ExpertComponent,
    BookComponent,
    ExpertDigestComponent,
  ],
  imports: [
    LayoutModule,
    BrowserModule,
    AppRoutingModule,
    MatGridListModule,
    MatProgressSpinnerModule,
    BrowserAnimationsModule,
    HttpClientModule,
    MatCardModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,

    FlexLayoutModule,
    CalendarModule.forRoot({provide: DateAdapter, useFactory: momentAdapterFactory}),
    FormsModule,
  ],
  providers: [
    MatDatepickerModule,
    {provide: MAT_DATE_LOCALE, useValue: 'en-GB'},
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
