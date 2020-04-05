import {ArrayListMultimap} from './multimap.model';
import {Unit} from './unit.model';
import {DatabaseService} from './database.service';
import {Simulation} from './simulation.model';
import {Entity} from './entity.model';
import {DuplicateAddon, LiftWithoutAddon} from "./analysis.model";

export type Second = number;

export class Action {
  constructor(public time: Second, public complete: Second, public parent: CreateEntity = null) {}
  onStart(simulation: Simulation): void {}
  onComplete(simulation: Simulation): void {}
  get label(): string { return ''; }
}

export class CreateEntity extends Action {
  constructor(time: Second, public unit: Unit, parent: CreateEntity = null, public isMain: boolean = false,
              public count: number = 1) {
    super(time, isMain ? 0 : time + unit.time, parent);
  }

  onStart(simulation: Simulation): void {
    for (let i = 0; i < this.count; i++) {
      simulation.mineral -= this.unit.mineral;
      simulation.gas -= this.unit.gas;
      if (this.unit.supply > 0) {
        simulation.supply.current += this.unit.supply;
      }
    }

    simulation.queue.push(this);
  }

  onComplete(simulation: Simulation): void {
    for (let i = 0; i < this.count; i++) {
      if (this.unit.supply < 0) {
        simulation.supply.max -= this.unit.supply * this.count;
      }

      const entity = new Entity(this.unit, this);
      if (this.unit.isAddon) {
        const facility = simulation.getEntity(this.parent);
        if (facility !== null) {
          if(facility.addon === null) {
            facility.addon = this.unit;
          } else {
            simulation.errors.push(new DuplicateAddon(this, this.unit));
          }
        }
      }

      for(let i = 0; i < this.count; i++) {
        simulation.entities.push(entity);
      }


      simulation.queue = simulation.queue.filter(create => create !== this);
    }
  }

  get label(): string {
    return (this.count !== 1 ? 'x' + this.count + ' ' : '') + this.unit.name;
  }
}

export class Lift extends Action {
  constructor(time: Second, parent: CreateEntity) {
    super(time, time + 3, parent);
  }

  onStart(simulation: Simulation): void {
    const building: Entity = simulation.getEntity(this.parent);
    if (building !== null) {
      if(building.addon !== null) {
        building.addon = null;
      } else {
        simulation.errors.push(new LiftWithoutAddon(this));
      }
    }
  }

  get label(): string {
    return 'Lift';
  }
}

export class Land extends Action {
  constructor(time: Second, public addon: Unit, parent: CreateEntity) {
    super(time, time + 3, parent);
  }

  onComplete(simulation: Simulation): void {
    const building: Entity = simulation.getEntity(this.parent);
    if (building !== null) {
      if(building.addon === null) {
        building.addon = this.addon;
      } else {
        simulation.errors.push(new DuplicateAddon(this, this.addon));
      }
    }
  }

  get label(): string {
    return 'Land ' + this.addon.name;
  }
}

export interface IActionFactory {
  label: string;
  newAction(time: Second): Action;
}

export class CreateFactory implements IActionFactory {
  constructor(public unit: Unit, public create: CreateEntity = null, public count = 1) { }
  newAction(time: Second): Action {
    return new CreateEntity(time, this.unit, this.create, false, this.count);
  }
  get label(): string {
    return (this.count !== 1 ? 'x' + this.count + ' ' : '') + this.unit.name;
  }
}

export class LiftFactory implements IActionFactory {
  constructor(public create: CreateEntity) {}
  newAction(time: number): Action {
    return new Lift(time, this.create);
  }
  get label(): string {
    return 'Lift';
  }
}

export class LandFactory implements IActionFactory {
  constructor(public addon: Unit, public create: CreateEntity) {}
  newAction(time: number): Action {
    return new Land(time, this.addon, this.create);
  }
  get label(): string {
    return 'Land ' + this.addon.name;
  }
}

export type Save = {
  creates: {
    time: Second,
    unit: string,
    parent: number
  }[]
};

export class Order {
  actions = new ArrayListMultimap<Second, Action>();
  createMain = new CreateEntity(0, this.database.getMain(), null, true);
  constructor(public database: DatabaseService) { }

  appendAction(action: Action): void {
    this.actions.put(action.time, action);
    this.sort();
  }

  getLastActionComplete(create: CreateEntity): Second {
    const children = this.getChildren(create);
    if (children.length > 0) {
      return children[children.length - 1].complete;
    } else {
      return 0;
    }
  }

  getActions(): Action[] {
    return this.actions.entries
      .map(entry => entry.value);
  }

  getCreateActions(): CreateEntity[] {
    return this.actions.entries
      .map(entry => entry.value)
      .filter(action => action instanceof CreateEntity) as Array<CreateEntity>;
  }

  getBuildings(): CreateEntity[] {
    return this.getCreateActions().filter(create => create.parent === null);
  }

  remove(action: Action): void {
    this.actions.delete(action.time, action);
    if (action instanceof CreateEntity) {
      for (const child of this.getChildren(action)) {
        this.actions.delete(child.time, child);
      }
    }
  }

  getChildren(building: CreateEntity): Action[] {
    return this.actions.entries.filter(entry => entry.value.parent === building).map(entry => entry.value);
  }

  hasOverlap(building: CreateEntity): Action | null {
    let last = 0;
    for (const child of this.getChildren(building)) {
      if (child.time < last) {
        return child;
      }
      last = child.complete;
    }

    return null;
  }

  isQueueFreeBetween(create: CreateEntity, action: Action): boolean {
    const time = action.time;
    const complete = action.complete;
    const last: Second = 0;
    for (const child of this.getChildren(create)) {
      if (child.complete > time && child.time < complete && child !== action) {
        return false;
      }
      if (child.time >= complete) {
        return true;
      }
    }
    return true;
  }

  getAddonAt(create: CreateEntity, time: Second): Unit | null {
    let current: Unit = null;
    for (const action of this.getChildren(create)) {
      if (action instanceof CreateEntity && action.unit.isAddon) {
        current = action.unit;
      }
      else if (action instanceof Lift) {
        current = null;
      }
      else if (action instanceof Land) {
        current = action.addon;
      }
    }
    return current;
  }

  /** @return non-null If an action is performed before the building is completed */
  hasUnitBeforeComplete(building: CreateEntity): Second | null {
    const first = this.actions.entries
      .find(entry => entry.value instanceof CreateEntity && entry.value.parent === building);
    return first !== undefined && first.key < building.complete ? first.key : null;
  }

  sort(): void {
    const actions = new ArrayListMultimap<Second, Action>();
    for (const entry of this.actions.entries) {
      actions.put(entry.value.time, entry.value);
    }
    actions.entries.sort((a, b) => a.key - b.key);
    this.actions = actions;
  }

  serialize(): Save {
    const data: Save = {
      creates: []
    };

    const actions: Action[] = this.actions.entries.map(entry => entry.value);
    const creates: CreateEntity[] = this.getCreateActions();

    for (const create of creates) {
      const createData = {
        time: create.time,
        unit: create.unit.name,
        parent: null
      };

      switch (create.parent) {
        case null:
          createData.parent = -1;
          break;

        case this.createMain:
          createData.parent = -2;
          break;

        default:
          createData.parent = actions.indexOf(create.parent);
          break;
      }

      data.creates.push(createData);
    }
    return data;
  }

  deserialize(data: Save): void {
    this.actions.clear();

    for (const create of data.creates) {
      let parent: CreateEntity;

      switch (create.parent) {
        case -2:
          parent = this.createMain;
          break;

        case -1:
          parent = null;
          break;

        default:
          parent = (this.actions.entries[create.parent].value as CreateEntity);
          break;
      }
      this.appendAction(new CreateEntity(create.time, this.database.units[create.unit], parent));
    }
  }
}
