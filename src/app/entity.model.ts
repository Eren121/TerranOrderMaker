import {Unit} from "./unit.model";
import {CreateEntity} from "./order.model";

export class Entity {
  public addon: Unit = null;

  constructor(public unit: Unit, public create: CreateEntity = null) {}

  clone(): Entity {
    let entity = new Entity(this.unit, this.create);
    entity.addon = this.addon;
    return entity;
  }
}
