import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {BuildingComponent} from './building/building.component';
import {SecondsPipe} from './seconds.pipe';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {ChartsModule} from 'ng2-charts';
import {NgxChartsModule} from '@swimlane/ngx-charts';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {DatabaseService} from './database.service';
import {OrderComponent} from './order/order.component';
import {NewBuildingComponent} from './new-building/new-building.component';
import {TimepickerComponent} from './timepicker/timepicker.component';
import {AnalysisComponent} from './analysis/analysis.component';
import {UserService} from './user.service';
import {InstantComponent} from './instant/instant.component';
import {KeyPipe} from './key.pipe';
import { MatIconModule} from '@angular/material/icon';

@NgModule({
  declarations: [
    AppComponent,
    BuildingComponent,
    SecondsPipe,
    OrderComponent,
    NewBuildingComponent,
    TimepickerComponent,
    AnalysisComponent,
    InstantComponent,
    KeyPipe
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    FormsModule,
    NgbModule,
    ChartsModule,
    NgxChartsModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    MatIconModule
  ],
  providers: [
    DatabaseService,
    UserService,
    SecondsPipe
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
