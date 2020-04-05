import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {Order, Second} from '../order.model';
import {Instant, START_RESOURCES} from '../simulation.model';
import {UserService} from '../user.service';
import {DatabaseService} from "../database.service";
import {Unit} from "../unit.model";

@Component({
  selector: 'app-instant',
  templateUrl: './instant.component.html',
  styleUrls: ['./instant.component.scss']
})
export class InstantComponent implements OnInit {
  order: Order = this.user.order;
  time: Second = 0;
  @Output() timeChanged = new EventEmitter<Second>();

  constructor(public user: UserService, public database: DatabaseService) { }

  ngOnInit(): void {

  }

  getEntities(): any {
    let entities = this.getUnitsCount(this.user.result.instants[this.time]);

    for(let key of Object.keys(this.getMaxEntities())) {
      if(entities[key] === undefined) {
        entities[key] = 0;
      }
    }

    return entities;
  }

  getMaxEntities(): any {
    return this.getUnitsCount(this.user.result.instants[this.user.result.maxTime]);
  }

  getUnitsCount(instant: Instant): any {
    let units = {};
    for(let entity of instant.entities) {
      let name = entity.unit.name;
      if(units[name] === undefined) {
        units[name] = 1;
      } else {
        units[name]++;
      }
    }

    units[this.database.getHarvester().name] -= START_RESOURCES.harvesters;
    if(units[this.database.getHarvester().name] === 0) {
      delete units[this.database.getHarvester().name];
    }

    units[this.database.getMain().name]--;
    if(units[this.database.getMain().name] === 0) {
      delete units[this.database.getMain().name];
    }
    return units;
  }

  getClassName(name: string): string {
    const unit: Unit = this.database.units[name];

    if(unit === this.database.getSupply()) {
      return 'primary';
    }
    if(unit === this.database.getMain()) {
      return 'primary';
    }
    if(unit === this.database.getHarvester()) {
      return 'primary';
    }
    if(unit.isAddable) {
      return 'success';
    }
    if(unit.supply > 0) {
      return 'danger';
    }
    if(unit === this.database.getGas()) {
      return 'info';
    }

    return 'dark';
  }

  getBackground(count: number, max: number, queued: number): string {
    let color = 'green';
    let color2 = 'orange';
    let percent = count / max * 100.0;
    let percent2 = (count + queued) / max * 100.0;
    return `linear-gradient(to right, ${color} ${percent}%, ${percent}%, ${color2} ${percent2}%, ${percent2}%, transparent 100%)`;
  }
}
