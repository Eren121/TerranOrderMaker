import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'seconds'
})
export class SecondsPipe implements PipeTransform {
  pad(val: number): string {
    return (val < 10 ? '0' : '') + val;
  }

  transform(totalSeconds: number): string {
    const minutes: number = Math.floor(totalSeconds / 60);
    const seconds: number = totalSeconds % 60;
    return this.pad(minutes) + ':' + this.pad(seconds);
  }
}
