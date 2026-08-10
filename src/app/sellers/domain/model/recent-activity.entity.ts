import {BaseEntity} from '../../../shared/domain/model/base-entity';

export type ActivityStatus = 'confirmed' | 'paid' | 'credit' | 'scheduled';

export class RecentActivity implements BaseEntity {
  private _id: number; private _document: string; private _client: string;
  private _clientDetail: string; private _total: number | null;
  private _status: ActivityStatus; private _timeAgo: string;
  constructor(a: {id:number; document:string; client:string; clientDetail:string; total:number|null; status:ActivityStatus; timeAgo:string}) {
    this._id=a.id; this._document=a.document; this._client=a.client;
    this._clientDetail=a.clientDetail; this._total=a.total; this._status=a.status; this._timeAgo=a.timeAgo;
  }
  get id() { return this._id; }
  get document() { return this._document; }
  get client() { return this._client; }
  get clientDetail() { return this._clientDetail; }
  get total() { return this._total; }
  get status() { return this._status; }
  get timeAgo() { return this._timeAgo; }
}

