import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ExpertsComponent} from "./experts/experts.component";
import {ExpertComponent} from "./expert/expert.component";
import {BookComponent} from "./book/book.component";


const routes: Routes = [
  {
    path: 'experts',
    component: ExpertsComponent,
  }, {
    path: 'experts/:id',
    component: ExpertComponent,
  }, {
    path: 'book/:id',
    component: BookComponent,
  },
  {
    path: '**',
    redirectTo: 'experts'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
