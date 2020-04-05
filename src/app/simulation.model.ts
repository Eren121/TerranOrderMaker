import {ArrayListMultimap} from './multimap.model';
import {
  Action,
  CreateEntity,
  CreateFactory,
  IActionFactory,
  LandFactory,
  LiftFactory,
  Order,
  Second
} from './order.model';
import {Entity} from './entity.model';
import {Unit} from './unit.model';
import {DatabaseService, REACTOR, TECH_LAB} from './database.service';
import {Invalid} from "./analysis.model";

const OPTMIZED_MINERAL_SPEED = 45.0 / 60.0;
const MINERAL_SPEED = 40.0 / 60.0;
const GAS_SPEED = 0.89;
const MULE_SPEED = 3.75;
const MAX_TIME = 60 * 10;

class Event {
  constructor(public time: Second) {}
  trigger(simulation: Simulation): void {}
}

class Start extends Event {
  constructor(private action: Action) {
    super(action.time);
  }

  trigger(simulation: Simulation): void {
    this.action.onStart(simulation);
  }
}

class Complete extends Event {
  constructor(private action: Action) {
    super(action.complete);
  }

  trigger(simulation: Simulation): void {
    this.action.onComplete(simulation);
  }
}

export class Instant {
  entities: Entity[] = [];
  constructor(public time: number,
              public mineral: number, public gas: number,
              public supply: Supply,
              entities: Entity[],
              public queue: CreateEntity[]) {
    for (const entity of entities) {
      this.entities.push(entity.clone());
    }
  }

  isPossible(): boolean {
    return this.mineral >= 0 && this.gas >= 0 && this.supply.current <= this.supply.max;
  }

  getEntity(create: CreateEntity): Entity | null {
    return this.entities.find(entity => entity.create === create) || null;
  }

  getQueued(unit: Unit): number {
    return this.queue.filter(create => create.unit === unit).length;
  }
}

export class Result {
  instants: Instant[] = [];
  constructor(public maxTime: number, public lastTime: number, private database: DatabaseService,
              public order: Order, public errors: Invalid[]) {}

  /** Checks mineral, gas, supply, and requirements */
  findQuickestPossibleTime(factory: CreateFactory): Second {
    const building: Unit = factory.unit;
    const count: number = factory.count;
    let available: Second = 0;

    if (building.requirement !== null) {
      available = Infinity;
      const require: Unit = this.database.units[building.requirement];
      for (const instant of this.instants) {
        if (instant.entities.find(e => e.unit === require) !== undefined) {
          available = instant.time;
          break;
        }
      }

      if (available === Infinity) {
        return Infinity;
      }
    }

    let time: Second = Infinity;
    for (let i = available; i < this.maxTime; i++) {
      const instant = this.instants[i];
      if (instant.supply.current + building.supply * count <= instant.supply.max &&
        instant.mineral - building.mineral * count >= 0 &&
        instant.gas - building.gas * count >= 0) {
        if (time === Infinity) {
          time = instant.time;
        }
      }
      else {
        time = Infinity;
      }
    }

    return time;
  }

  /** Checks queue collision, mineral, gas, supply, and requirements */
  findQuickestPossibleQueue(factory: CreateFactory, order: Order): Second {
    const create: CreateEntity = factory.create;
    const unit: Unit = factory.unit;
    let time: Second = this.findQuickestPossibleTime(factory);

    if (time === Infinity) {
      return Infinity;
    }

    time = Math.max(time, create.complete);
    for (; time < this.maxTime; time++) {

      let addon: Unit = null;
      if (factory.unit.isAdvanced) {
        addon = this.database.units[TECH_LAB];
      }
      if (factory.count > 1) {
        addon = this.database.units[REACTOR];
      }

      if (addon !== null &&
        this.instants[time].entities.find(entity => entity.create === factory.create).addon !== addon) {
        continue;
      }

      const children: Action[] = order.getChildren(create);
      children.push(new CreateEntity(time, unit, create));
      children.sort((a, b) => a.time - b.time);

      let compatible = true;
      let last: Second = 0;
      for (const child of children) {
        if (child.time < last) {
          compatible = false;
          break;
        }
        last = child.complete;
      }

      if (compatible) {
        return time;
      }
    }

    return Infinity;
  }

  findQuickestPossibleAction(factory: IActionFactory, order: Order): Second {
    if (factory instanceof CreateFactory) {
      const createFactory: CreateFactory = factory;
      return this.findQuickestPossibleQueue(createFactory, order);
    }
    else if (factory instanceof LiftFactory) {
      return order.getLastActionComplete(factory.create);
    }
    else if (factory instanceof LandFactory) {
      return order.getLastActionComplete(factory.create);
    }
    else {
      throw new Error('unimplemented');
    }
  }
}

type Supply = {
  current: number,
  max: number
};

export const START_RESOURCES = {
  mineral: 50,
  harvesters: 12
};

export class Simulation {
  alreadyRun = false;
  events = new ArrayListMultimap<Second, Event>();
  entities = new Array<Entity>();
  queue = new Array<CreateEntity>();
  errors = new Array<Invalid>();
  mineral = 0;
  gas = 0;
  supply = {current: 0, max: 0};
  database = this.order.database;

  constructor(public order: Order) {
    for (const action of order.actions) {
      this.appendEvent(new Start(action));
      this.appendEvent(new Complete(action));
    }
    this.mineral = START_RESOURCES.mineral;
    this.gas = 0;
    for (let i = 0; i < START_RESOURCES.harvesters; i++) {
      this.entities.push(new Entity(this.database.getHarvester(), order.createMain));
    }
    this.entities.push(new Entity(this.database.getMain()));
    this.supply = this.getSupply();
  }

  private appendEvent(event: Event): void {
    this.events.put(event.time, event);
  }

  getLastTime(): number {
    if (this.events.entries.length === 0) {
      return 0;
    } else {
      return this.events.entries.reduce(
        (acc, cur) => acc.key > cur.key ? acc : cur
      ).key;
    }
  }

  getEntity(create: CreateEntity): Entity | null {
    return this.entities.find(entity => entity.create === create) || null;
  }

  getSupply(): Supply {
    const res: Supply = {current: 0, max: 0};
    for (const entity of this.entities) {
      const unit = entity.unit;
      if (unit.supply > 0) {
        res.current += unit.supply;
      } else if (unit.supply < 0) {
        res.max -= unit.supply;
      }
    }
    return res;
  }

  static getMineralRate(harvesters: number, orbitals: number = 0): number {
    let rate = 0;
    if (harvesters <= 16) {
      rate += OPTMIZED_MINERAL_SPEED * harvesters;
    } else {
      rate += MINERAL_SPEED * harvesters;
    }
    rate += MULE_SPEED * orbitals;
    return rate;
  }

  static getGasRate(harvesters: number) {
    return harvesters * GAS_SPEED;
  }

  run(): Result {
    if (this.alreadyRun) {
      throw new Error();
    } else {
      this.alreadyRun = true;
    }

    const lastTime = Math.max(this.getLastTime(), 60) + 10;
    const maxTime = Math.max(60 * 10, lastTime);
    const result = new Result(maxTime, lastTime, this.database, this.order, this.errors);

    for (let time = 0; time <= maxTime; time++) {
      const orbitals = this.entities.filter(entity => entity.unit === this.database.getOrbital()).length;
      const harvesters = this.entities.filter(entity => entity.unit === this.database.getHarvester()).length;
      const gasCount = this.entities.filter(entity => entity.unit === this.database.getGas()).length;
      const inGas = gasCount * 3;
      const inMineral = harvesters - inGas;

      for (const event of this.events.get(time)) {
        event.trigger(this);
      }

      this.mineral += Simulation.getMineralRate(harvesters - inGas, orbitals);
      this.gas += Simulation.getGasRate(inGas);

      const instant = new Instant(time, this.mineral, this.gas, {...this.supply}, this.entities, [...this.queue]);
      result.instants.push(instant);
    }

    return result;
  }
}
