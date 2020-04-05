import {min} from "rxjs/operators";

export class Unit {
  isAddable = false;
  isAddon = false;
  isBuilding = false;
  isAdvanced = false;
  parent: string = null;
  requirement: string = null;

  constructor(public name: string,
              public mineral: number,
              public gas: number,
              public time: number,
              public supply: number = 0) {
  }

  setBuilding(): Unit {
    this.isBuilding = true;
    return this;
  }

  setAdvanced(): Unit {
    this.isAdvanced = true;
    return this;
  }

  setParent(parent: string): Unit {
    this.parent = parent;
    return this;
  }

  setRequire(requirement: string): Unit {
    this.requirement = requirement;
    return this;
  }

  setAddon(): Unit {
    this.isAddon = true;
    return this;
  }

  setAddable(): Unit {
    this.isAddable = true;
    return this;
  }
}

export class Upgrade {
  inAddon = this.parent.isAddable;
  isLevelable = this.level !== null;
  constructor(public name: string,
              public mineral: number,
              public gas: number,
              public time: number,
              public parent: Unit,
              public require: Unit = null,
              public level: number = null) {

    if(level !== null) {
      this.name += " Level " + level;
    }
  }
}
