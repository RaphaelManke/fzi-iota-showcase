import { Hash, Trytes } from '@iota/core/typings/types';
import { User } from './envInfo';

export class Users {
  private byId = new Map<Trytes, User>();
  private bySeed: Map<Hash, User>;

  constructor(users: Map<Hash, User>) {
    users.forEach((u) => this.byId.set(u.id, u));
    this.bySeed = users;
  }

  public getById(id: Trytes) {
    return this.byId.get(id);
  }

  public getBySeed(seed: Hash) {
    return this.bySeed.get(seed);
  }
}
