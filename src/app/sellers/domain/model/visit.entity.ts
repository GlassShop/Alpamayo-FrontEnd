import {BaseEntity} from '../../../shared/domain/model/base-entity';

export type VisitStatus = 'scheduled' | 'completed' | 'cancelled';

export class Visit implements BaseEntity {
  private readonly _id: number;
  private readonly _title: string;
  private readonly _client: string;
  private readonly _location: string;
  private readonly _scheduledAt: string;
  private readonly _status: VisitStatus;
  private readonly _notes: string;

  constructor(v: {
    id: number;
    title: string;
    client: string;
    location: string;
    scheduledAt: string;
    status: VisitStatus;
    notes?: string;
  }) {
    this._id = v.id;
    this._title = v.title;
    this._client = v.client;
    this._location = v.location;
    this._scheduledAt = v.scheduledAt;
    this._status = v.status;
    this._notes = v.notes ?? '';
  }

  get id() { return this._id; }
  get title() { return this._title; }
  get client() { return this._client; }
  get location() { return this._location; }
  get scheduledAt() { return this._scheduledAt; }
  get status() { return this._status; }
  get notes() { return this._notes; }
}
