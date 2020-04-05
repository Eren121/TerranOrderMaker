import {Component, Input, OnInit} from '@angular/core';
import {DatabaseService} from "../database.service";
import {CreateEntity, CreateFactory, IActionFactory, Order, Second} from "../order.model";
import {UserService} from "../user.service";
import {Result, Simulation} from "../simulation.model";
import {Unit} from "../unit.model";

@Component({
  selector: 'app-new-building',
  templateUrl: './new-building.component.html',
  styleUrls: ['./new-building.component.scss']
})
export class NewBuildingComponent implements OnInit {
  order: Order = this.user.order;
  time = 0;
  notAvailable = false;
  factories = this.database.getPossibleBuildings();
  index = 0;

  constructor(public database: DatabaseService, public user: UserService) { }

  ngOnInit(): void {
  }

  onAddUnit(factory: CreateFactory): void {
    this.order.appendAction(factory.newAction(this.time));
    this.user.onOrderUpdate();
  }

  onSearchQuickest(factory: CreateFactory): void {
    let unit: Unit = factory.unit;
    let time: Second = this.user.result.findQuickestPossibleTime(factory);
    if(time === Infinity) {
      this.notAvailable = true;
    } else {
      this.time = time;
      this.notAvailable = false;
    }
  }
}
