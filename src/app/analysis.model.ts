import {Instant, Result} from './simulation.model';
import {Action, CreateEntity, Land, Lift, Order, Second} from './order.model';
import {DatabaseService, REACTOR, TECH_LAB} from './database.service';
import {Unit} from './unit.model';

export class Invalid {
  constructor(public action: Action) { }
  get label(): string { return ''; }
}

export class MissingResource extends Invalid {
  constructor(public action: Action) { super(action); }
}

export class MissingMineral extends MissingResource {
  constructor(public action: Action) { super(action); }
  get label(): string { return 'Not enough mineral'; }
}

export class MissingGas extends MissingResource {
  constructor(public action: Action) { super(action); }
  get label(): string { return 'Not enough gas'; }
}

export class MissingSupply extends MissingResource {
  constructor(public action: Action) { super(action); }
  get label(): string { return 'Not enough supply'; }
}

export class MissingRequirement extends Invalid {
  constructor(action: Action) { super(action); }
  get label(): string { return 'Tech tree not respected'; }
}

export class ChildError extends Invalid {
  constructor(public action: Action) { super(action); }
}

export class ParentIncomplete extends ChildError {
  constructor(action: Action) { super(action); }
  get label(): string { return 'Action performed even before the building is complete'; }
}

export class QueueCollision extends ChildError {
  constructor(action: Action) { super(action); }
  get label(): string { return 'Multiple units produced at the same time in the same building'; }
}

export class AddonError extends Invalid {
  constructor(action: Action, public addon: Unit) { super(action); }
}

export class MissingAddon extends AddonError {
  constructor(action: Action, addon: Unit) { super(action, addon); }
  get label(): string { return 'Missing add-on'; }
}

export class LiftWithoutAddon extends Invalid {
  constructor(action: Action) { super(action); }
  get label(): string { return 'Trying to lift a building which doesn\'t has any Add-On connected to'; }
}

export class DuplicateAddon extends AddonError {
  constructor(action: Action, addon: Unit) { super(action, addon); }
  get label(): string { return 'An add-On is built on a building which already has one'; }
}

export class Analysis {
  errors = new Array<Invalid>();
  order: Order = this.result.order;
  database: DatabaseService = this.order.database;

  constructor(public result: Result) {
    this.errors = this.errors.concat(result.errors);
    const actions = this.order.getActions();
    const creates = this.order.getCreateActions();
    for (const create of creates) {
      const instant = result.instants[create.time];
      if (create.unit.requirement !== null) {
        const require: Unit = this.database.units[create.unit.requirement];
        if (instant.entities.find(entity => entity.unit === require) === undefined) {
          this.errors.push(new MissingRequirement(create));
        }
      }
      if (create.unit.isAdvanced &&
         instant.entities.find(entity => entity.unit === this.database.units[TECH_LAB]) === undefined) {
        this.errors.push(new MissingAddon(create, this.database.units[TECH_LAB]));
      }
      if (create.count > 1 &&
         instant.entities.find(entity => entity.unit === this.database.units[REACTOR]) === undefined) {
        this.errors.push(new MissingAddon(create, this.database.units[REACTOR]));
      }
      if (instant.mineral < 0 && create.unit.mineral > 0) {
        this.errors.push(new MissingMineral(create));
      }
      if (instant.gas < 0 && create.unit.gas > 0) {
        this.errors.push(new MissingGas(create));
      }
      if (instant.supply.current > instant.supply.max && create.unit.supply > 0) {
        this.errors.push(new MissingSupply(create));
      }
    }
    for (const action of actions) {
      if (action.parent !== null) {
        if (action.time < action.parent.complete) {
          this.errors.push(new ParentIncomplete(action));
        }
        if (!this.order.isQueueFreeBetween(action.parent, action)) {
          this.errors.push(new QueueCollision(action));
        }
      }
    }
    for (const land of actions.filter(action => action instanceof Land).map(action => action as Land)) {
      const instant: Instant = result.instants[land.complete];
      const usedAddons: number = instant.entities.filter(entity => entity.addon === land.addon).length;
      const totalAddonsCount: number = instant.entities.filter(entity => entity.unit === land.addon).length;

      console.log(usedAddons + "used/" + totalAddonsCount + "total");
      if (usedAddons > totalAddonsCount) {
        this.errors.push(new MissingAddon(land, land.addon));
      }
    }
  }

  filterErrors(action: Action): Invalid[] {
    return this.errors.filter(error => error.action === action);
  }
}
