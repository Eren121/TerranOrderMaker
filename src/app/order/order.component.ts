import {Component, OnInit, TemplateRef} from '@angular/core';
import {DatabaseService} from "../database.service";
import {Order, Save} from "../order.model";
import {UserService} from "../user.service";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {animate, state, style, transition, trigger} from "@angular/animations";

@Component({
  selector: 'app-order',
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.scss'],
  animations: [
    trigger('openClose', [
      state('void', style({
        height: 0,
        marginTop: 0,
        marginBottom: 0,
        paddingTop: 0,
        paddingBottom: 0,
        border: 'none',
        transform: 'translate(-90%, -30px)',
        opacity: 0
      })),
      transition('* <=> void', [
        animate(200)
      ])
    ])
  ]
})
export class OrderComponent implements OnInit {
  order: Order = this.user.order;
  save: Save;

  constructor(public database: DatabaseService, private user: UserService, public modalService: NgbModal) { }

  ngOnInit(): void {
  }

  reset(): void {
    this.order.actions.clear();
    this.user.onOrderUpdate();
  }

  onSave(modal: TemplateRef<any>): void {
    this.save = this.order.serialize();
    this.modalService.open(modal);
  }

  onLoad(content: string): void {
    let save: Save = JSON.parse(content);
    this.save = save;
    this.order.deserialize(save);
    this.user.onOrderUpdate();
  }

  select(element): void {
    let range = new Range();
    range.selectNode(element);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
  }
}
