import { Hash, Trytes } from '@iota/core/typings/types';
import { User, Position } from './envInfo';
import * as fs from 'fs';
import { getNextId } from './idSupplier';

export class Users {
  public static fromFile(
    path: string,
    idSupplier: () => Trytes = getNextId,
  ): Users {
    const descs: UserDescription[] = JSON.parse(
      fs.readFileSync(path).toString(),
    );
    const users = new Map<Trytes, User>();
    descs.forEach((d) =>
      users.set(d.seed, { loggedIn: false, id: idSupplier(), ...d, balance: 0 }),
    );
    return new Users(users);
  }
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

export interface UserDescription {
  name: string;
  position: Position;
  stop: Hash;
  seed: Hash;
}
