import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {AnalysisComponent} from "./analysis/analysis.component";
import {OrderComponent} from "./order/order.component";


const routes: Routes = [
  {path: '', component: OrderComponent},
  {path: 'analysis', component: AnalysisComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
