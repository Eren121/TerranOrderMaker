import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {DatabaseService} from '../database.service';
import {Action, CreateEntity, IActionFactory, Order, Second} from '../order.model';
import {UserService} from '../user.service';
import {Invalid} from '../analysis.model';
import {animate, state, style, transition, trigger} from '@angular/animations';

type NextConfig = {
  time: number,
  index: number
};

@Component({
  selector: 'app-building',
  templateUrl: './building.component.html',
  styleUrls: ['./building.component.scss']
})
export class BuildingComponent implements OnInit {
  twice = false;
  order: Order = this.user.order;
  @Input() create: CreateEntity;
  supply: number;
  possibleActions: IActionFactory[];
  notAvailable = false;
  nextConfig: NextConfig = {
    time: 0,
    index: 0
  };
  errors: Invalid[];
  hasError: boolean;

  constructor(public database: DatabaseService, public user: UserService) {
    this.user.analysisChange.subscribe(analysis => {
      this.errors = analysis.filterErrors(this.create);
      this.hasError = this.errors.length > 0;
    });
  }

  ngOnInit(): void {
    this.possibleActions = this.database.getPossibleActions(this.create);
    this.supply = this.user.result.instants[this.create.time].supply.current;
    if (this.possibleActions.length > 0) {
      this.nextConfig.time = this.create.complete;
    }
    this.errors = this.user.analysis.filterErrors(this.create);
    this.hasError = this.errors.length > 0;
  }

  onAppend(time: Second, factory: IActionFactory): void {
    const child: Action = factory.newAction(time);
    this.order.appendAction(child);
    this.nextConfig.time = child.complete;
    this.user.onOrderUpdate();
    this.onSearchQuickest(factory);
  }

  onSearchQuickest(factory: IActionFactory): void {
    const time: Second = this.user.result.findQuickestPossibleAction(factory, this.order);
    if (time === Infinity) {
      this.notAvailable = true;
    } else {
      this.nextConfig.time = time;
      this.notAvailable = false;
    }
  }

  onTimeChanged(): void {

    this.order.sort();
    this.user.onOrderUpdate();
    this.supply = this.user.result.instants[this.create.time].supply.current;
    this.errors = this.user.analysis.filterErrors(this.create);
    this.hasError = this.errors.length > 0;
  }

  onRemove(): void {
    this.order.remove(this.create);
    this.user.onOrderUpdate();
  }

  onRemoveChild(action: Action): void {
    this.order.remove(action);
    this.user.onOrderUpdate();
  }
}
