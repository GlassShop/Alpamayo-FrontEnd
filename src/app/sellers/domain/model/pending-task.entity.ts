import {BaseEntity} from '../../../shared/domain/model/base-entity';

export class PendingTask implements BaseEntity {
  private _id: number;
  private _description: string;
  private _priority: 'high' | 'medium' | 'low';
  constructor(t: {id: number; description: string; priority: 'high'|'medium'|'low'}) {
    this._id = t.id; this._description = t.description; this._priority = t.priority;
  }
  get id() { return this._id; }
  get description() { return this._description; }
  get priority() { return this._priority; }
}

