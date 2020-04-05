import {Injectable} from '@angular/core';
import {Unit, Upgrade} from "./unit.model";
import {CreateEntity, CreateFactory, IActionFactory, LandFactory, LiftFactory} from "./order.model";

export const TECH_LAB = "Tech Lab";
export const REACTOR = "Reactor";
export const EBAY = "Engineering Bay";
export const ARMORY = "Armory";
export const INFANTRY_WEAPONS = "Infantry Weapons";
export const INFANTRY_ARMOR = "Infantry Armor"
export const BARRACKS = "Barracks";
export const FACTORY = "Factory";
export const SPATIOPORT = "Spatioport";

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  unitsArray = new Array<Unit>();
  units: any = {};
  onlyBuildings = new Array<Unit>();
  buildableFrom: any = {};

  upgrades: any = {};
  upgradesArray = new Array<Upgrade>();

  constructor() {
    //https://liquipedia.net/starcraft2/Unit_Statistics_(Legacy_of_the_Void)#tab-2
    this.registerUnit(new Unit("SCV", 50, 0, 12, 1).setParent("Command Center"));
    this.registerUnit(new Unit("Marine", 50, 0, 18, 1).setParent("Barracks"));
    this.registerUnit(new Unit("Marauder", 100, 25, 21, 2).setParent("Barracks").setAdvanced());
    this.registerUnit(new Unit("Reaper", 50, 50, 32, 1).setParent("Barracks"));
    this.registerUnit(new Unit("Ghost", 150, 125, 29, 2).setParent("Barracks").setRequire("Ghost Academy").setAdvanced());
    this.registerUnit(new Unit("Hellion", 100, 0, 21, 2).setParent("Factory"));
    this.registerUnit(new Unit("Window Mine", 75, 25, 21, 2).setParent("Factory"));
    this.registerUnit(new Unit("Siege Tank", 150, 125, 32, 3).setParent("Factory").setAdvanced());
    this.registerUnit(new Unit("Thor", 300, 200, 43, 6).setParent("Factory").setRequire("Armory").setAdvanced());
    this.registerUnit(new Unit("Viking", 150, 75, 30, 2).setParent("Starport"));
    this.registerUnit(new Unit("Medivac", 100, 100, 30, 2).setParent("Starport"));
    this.registerUnit(new Unit("Liberator", 150, 150, 43, 3).setParent("Starport"));
    this.registerUnit(new Unit("Banshee", 150, 100, 43, 3).setParent("Starport").setAdvanced());
    this.registerUnit(new Unit("Raven", 100, 200, 43, 2).setParent("Starport").setAdvanced());
    this.registerUnit(new Unit("Battlecruiser", 400, 300, 64, 6).setParent("Starport").setRequire("Fusion Core").setAdvanced());

    //https://liquipedia.net/starcraft2/Terran_Building_Statistics_(Legacy_of_the_Void)
    this.registerUnit(new Unit("Command Center", 400, 0, 71, -15).setBuilding());
    this.registerUnit(new Unit("Orbital Command", 150, 0, 25).setParent("Command Center").setRequire("Barracks"));
    this.registerUnit(new Unit("Planetary Fortress", 150, 150, 36).setParent("Command Center"));
    this.registerUnit(new Unit("Supply Depot", 100, 0, 21, -8).setBuilding());
    this.registerUnit(new Unit("Refinery", 75, 0, 21).setBuilding());
    this.registerUnit(new Unit("Barracks", 150, 0, 46).setBuilding().setRequire("Supply Depot").setAddable());
    this.registerUnit(new Unit(EBAY, 125, 0, 25).setBuilding());
    this.registerUnit(new Unit("Bunker", 100, 0, 29).setBuilding().setRequire("Barracks"));
    this.registerUnit(new Unit("Missile Turret", 100, 0, 18).setBuilding().setRequire("Engineering Bay"));
    this.registerUnit(new Unit("Sensor Tower", 125, 100, 18).setBuilding().setRequire("Engineering Bay"));
    this.registerUnit(new Unit("Factory", 150, 100, 43).setBuilding().setRequire("Barracks").setAddable());
    this.registerUnit(new Unit("Ghost Academy", 150, 50, 29).setBuilding().setRequire("Barracks"));
    this.registerUnit(new Unit("Armory", 150, 100, 46).setBuilding().setRequire("Factory"));
    this.registerUnit(new Unit("Starport", 150, 100, 36).setBuilding().setRequire("Factory").setAddable());
    this.registerUnit(new Unit("Fusion Core", 150, 150, 46).setBuilding().setRequire("Starport"));
    this.registerUnit(new Unit(TECH_LAB, 50, 25, 18).setAddon());
    this.registerUnit(new Unit(REACTOR, 50, 50, 36).setAddon());

    this.registerUpgrade(new Upgrade(INFANTRY_WEAPONS, 100, 100, 114, this.units[EBAY], null, 1));
    this.registerUpgrade(new Upgrade(INFANTRY_WEAPONS, 175, 175, 136, this.units[EBAY], this.units[ARMORY], 2));
    this.registerUpgrade(new Upgrade(INFANTRY_WEAPONS, 250, 250, 157, this.units[EBAY], this.units[ARMORY], 3));
    this.registerUpgrade(new Upgrade(INFANTRY_ARMOR, 100, 100, 114, this.units[EBAY], null, 1));
    this.registerUpgrade(new Upgrade(INFANTRY_ARMOR, 175, 175, 136, this.units[EBAY], this.units[ARMORY], 2));
    this.registerUpgrade(new Upgrade(INFANTRY_ARMOR, 250, 250, 157, this.units[EBAY], this.units[ARMORY], 3));

    this.registerUpgrade(new Upgrade("Smart Servos", 100, 100, 79, this.units[FACTORY], this.units[ARMORY]));
    this.registerUpgrade(new Upgrade("Mag-Field Accelerator", 100, 100, 100, this.units[FACTORY]));
    this.registerUpgrade(new Upgrade("Mag-Field Accelerator", 100, 100, 100, this.units[FACTORY]));
    this.mapChildren();
  }

  getAddons(): Unit[] {
    return this.unitsArray.filter(unit => unit.isAddon);
  }

  getMain(): Unit {
    return this.units["Command Center"];
  }

  getSupply(): Unit {
    return this.units["Supply Depot"];
  }

  getHarvester(): Unit {
    return this.units["SCV"];
  }

  getGas(): Unit {
    return this.units["Refinery"];
  }

  getOrbital(): Unit {
    return this.units["Orbital Command"];
  }

  getPossibleBuildings(): CreateFactory[] {
    return this.onlyBuildings.map(unit => new CreateFactory(unit));
  }

  getPossibleActions(create: CreateEntity): IActionFactory[] {
    let factories = new Array<IActionFactory>();
    let buildables: Unit[] = this.buildableFrom[create.unit.name];
    buildables.forEach(unit => factories.push(new CreateFactory(unit, create)));

    if(create.unit.isAddable) {
      for(let unit of buildables.filter(unit => !unit.isAdvanced)) {
        factories.push(new CreateFactory(unit, create, 2));
      }
      for(let unit of this.getAddons()) {
        factories.push(new CreateFactory(unit, create));
      }
      factories.push(new LiftFactory(create));
      for(let unit of this.getAddons()) {
        factories.push(new LandFactory(unit, create));
      }
    }

    return factories;
  }

  private registerUnit(unit: Unit): void {
    this.unitsArray.push(unit);
    this.units[unit.name] = unit;
    if(unit.isBuilding) {
      this.onlyBuildings.push(unit);
    }
  }

  private registerUpgrade(upgrade: Upgrade): void {
    this.upgradesArray.push(upgrade);
    this.upgrades[upgrade.name] = upgrade;
  }

  private mapChildren(): void {
    for(let unit of this.unitsArray) {
      this.buildableFrom[unit.name] = [];
    }
    for(let unit of this.unitsArray) {
      if(unit.parent !== null) {
        this.buildableFrom[unit.parent].push(unit);
      }
    }
  }
}
