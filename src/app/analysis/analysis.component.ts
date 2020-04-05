import {Component, OnInit} from '@angular/core';
import {DatabaseService} from '../database.service';
import {UserService} from '../user.service';
import {Instant, Simulation} from '../simulation.model';
import {Order} from '../order.model';
import {SecondsPipe} from '../seconds.pipe';
import {Analysis, Invalid} from "../analysis.model";

@Component({
  selector: 'app-analysis',
  templateUrl: './analysis.component.html',
  styleUrls: ['./analysis.component.scss']
})
export class AnalysisComponent implements OnInit {
  order: Order = this.user.order;
  analysis: Analysis = this.user.analysis;
  errors: Invalid[] = this.analysis.errors;
  chartsDataResources: any[];
  chartsDataSupply: any[];
  chartsLabel = new Array<string>();
  chartsOptions = {
    responsive: true,
    scaleShowVerticalLines: true
  };

  constructor(private database: DatabaseService, private user: UserService, private secondsPipe: SecondsPipe) {
    const minData = new Array<number>();
    const gasData = new Array<number>();
    const supplyData = new Array<number>();
    const supplyMaxData = new Array<number>();
    for (let i = 0; i < this.user.result.lastTime; i++) {
      const label = secondsPipe.transform(i);
      this.chartsLabel.push(label);
      const instant: Instant = this.user.result.instants[i];
      minData.push(instant.mineral);
      gasData.push(instant.gas);
      supplyData.push(instant.supply.current);
      supplyMaxData.push(instant.supply.max);
    }

    this.chartsDataResources = [
      {
        label: 'Mineral',
        borderColor: '#66ccff',
        backgroundColor: '#66ccff55',
        data: minData,
        spanGaps: true,
        pointRadius: 0,
        pointHitRadius: 3
      },
      {
        label: 'Gas',
        borderColor: '#99ff33',
        backgroundColor: '#99ff3355',
        data: gasData,
        pointRadius: 0,
        pointHitRadius: 3
      }
    ];

    this.chartsDataSupply = [
      {
        label: 'Supply Cap',
        borderColor: '#ff2c00',
        backgroundColor: 'transparent',
        data: supplyMaxData,
        pointRadius: 0,
        borderWidth: .5,
        pointHitRadius: 3
      },
      {
        label: 'Supply',
        borderColor: 'rgba(0, 0, 0, 0.05)',
        backgroundColor: 'rgba(99,30,9,0.28)',
        data: supplyData,
        pointRadius: 0,
        pointHitRadius: 3
      }
    ];
  }

  ngOnInit(): void {
  }
}
