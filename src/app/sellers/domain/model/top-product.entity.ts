import {BaseEntity} from '../../../shared/domain/model/base-entity';

export class TopProduct implements BaseEntity {
  private _id: number; private _name: string; private _detail: string;
  private _quantitySold: number; private _unit: string;
  constructor(p: {id:number; name:string; detail:string; quantitySold:number; unit:string}) {
    this._id=p.id; this._name=p.name; this._detail=p.detail; this._quantitySold=p.quantitySold; this._unit=p.unit;
  }
  get id() { return this._id; }
  get name() { return this._name; }
  get detail() { return this._detail; }
  get quantitySold() { return this._quantitySold; }
  get unit() { return this._unit; }
}

