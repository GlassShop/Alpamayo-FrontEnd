import {BaseEntity} from '../../../shared/domain/model/base-entity';

export class StockItem implements BaseEntity {
  private _id: number; private _name: string; private _detail: string;
  private _quantity: number; private _unit: string; private _isLow: boolean;
  constructor(s: {id:number; name:string; detail:string; quantity:number; unit:string; isLow:boolean}) {
    this._id=s.id; this._name=s.name; this._detail=s.detail;
    this._quantity=s.quantity; this._unit=s.unit; this._isLow=s.isLow;
  }
  get id() { return this._id; }
  get name() { return this._name; }
  get detail() { return this._detail; }
  get quantity() { return this._quantity; }
  get unit() { return this._unit; }
  get isLow() { return this._isLow; }
}

