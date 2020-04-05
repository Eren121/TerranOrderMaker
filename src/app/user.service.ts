import {EventEmitter, Injectable} from '@angular/core';
import {CreateEntity, Order} from "./order.model";
import {DatabaseService} from "./database.service";
import {Result, Simulation} from "./simulation.model";
import {exampleSave} from "./order/example";
import {Analysis} from "./analysis.model";

@Injectable({
  providedIn: 'root'
})
export class UserService {
  order = new Order(this.database);
  result: Result;
  analysis: Analysis;
  testOrder: Order = new Order(this.database);
  test = true;

  analysisChange = new EventEmitter<Analysis>();

  constructor(private database: DatabaseService) {
    this.testOrder.deserialize(exampleSave);

    if(this.test) {
      this.order = this.testOrder;
    }

    this.onOrderUpdate();
  }

  onOrderUpdate(): void {
    this.result = new Simulation(this.order).run();
    this.analysis = new Analysis(this.result);
    this.analysisChange.emit(this.analysis);
  }
}
