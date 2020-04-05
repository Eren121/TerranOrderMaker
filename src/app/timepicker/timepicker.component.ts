import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Injectable,
  Input,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import {Second} from "../order.model";
import {NgbTimeAdapter, NgbTimeStruct} from "@ng-bootstrap/ng-bootstrap";
import {FormControl} from "@angular/forms";

@Injectable()
export class NgbTimeSecondAdapter extends NgbTimeAdapter<number> {
  fromModel(seconds: number | null): NgbTimeStruct | null {
    return {
      hour: Math.floor(seconds / 3600),
      minute: Math.floor(seconds / 60),
      second: seconds % 60
    };
  }

  toModel(time: NgbTimeStruct | null): number | null {
    return time.hour * 3600 + time.minute * 60 + time.second;
  }
}

@Component({
  selector: 'app-timepicker',
  templateUrl: './timepicker.component.html',
  styleUrls: ['./timepicker.component.scss']
})
export class TimepickerComponent implements OnInit, AfterViewInit {
  @Input() max: number = 60 * 10;
  @Output() timeChange = new EventEmitter<number>();
  @ViewChild('container') private container: ElementRef;
  @ViewChild('timepicker') private timepicker: ElementRef;
  input: NgbTimeStruct;
  adapter = new NgbTimeSecondAdapter();

  @Input()
  set time(val: Second) {
    this.input = this.adapter.fromModel(val);
  }

  get time(): Second {
    return this.adapter.toModel(this.input);
  }

  ngAfterViewInit(): void {
    this.container.nativeElement.querySelector('.ngb-tp-hour').remove();
    this.container.nativeElement.querySelector('.ngb-tp-spacer').remove();
  }

  ngOnInit(): void {
  }

  onTimeChanged(val: NgbTimeStruct): void {
      this.input = this.adapter.fromModel(Math.min(this.max, this.adapter.toModel(val)));
      this.timeChange.emit(this.adapter.toModel(this.input));
  }
}
