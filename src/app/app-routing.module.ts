import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ExpertsComponent} from "./screens/experts/experts.component";
import {ExpertComponent} from "./screens/expert/expert.component";
import {BookComponent} from "./screens/book/book.component";


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
