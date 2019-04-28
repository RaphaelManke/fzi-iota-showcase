import { Hash, Trytes } from '@iota/core/typings/types';
import { User, Position } from './envInfo';
import * as fs from 'fs';
import { getNextId } from './idSupplier';
import { log, createAttachToTangle } from 'fzi-iota-showcase-client';
import { UserState } from 'fzi-iota-showcase-user-client';
import { API, composeAPI } from '@iota/core';

export class Users {
  public static fromFile(
    path: string,
    {
      idSupplier = getNextId,
      mockPayments = false,
      provider,
      iota = composeAPI({
        provider,
        attachToTangle: createAttachToTangle(provider),
      }),
    }: {
      idSupplier?: () => Trytes;
      provider?: string;
      iota?: API;
      mockPayments?: boolean;
    },
  ): Users {
    const descs: UserDescription[] = JSON.parse(
      fs.readFileSync(path).toString(),
    );
    const users = new Map<Trytes, User>();
    descs.forEach((d) =>
      users.set(d.seed, { loggedIn: false, id: idSupplier(), ...d, balance: 0 }),
    );
    return new Users(users, provider, iota, mockPayments);
  }

  private byId = new Map<Trytes, { info: User; state: UserState }>();
  private bySeed = new Map<Hash, { info: User; state: UserState }>();
  private iota: API;

  constructor(
    users: Map<Hash, User>,
    provider?: string,
    iota: API | undefined = provider
      ? composeAPI({
          provider,
          attachToTangle: createAttachToTangle(provider),
        })
      : undefined,
    mockPayments = false,
  ) {
    if (!iota) {
      throw new Error('IOTA client must be set');
    }
    this.iota = iota;
    Array.from(users.entries()).forEach(([seed, user]) => {
      const state = new UserState(seed, user.id, { iota, mockPayments });
      this.byId.set(user.id, { info: user, state });
      this.bySeed.set(seed, { info: user, state });
    });
  }

  public async initUsers(parallelInit = false) {
    const promises = [];
    for (const [seed, { info, state }] of this.bySeed) {
      const p = (async () => {
        log.info('Init user %s', info.id);
        const result = await state.getBalance();
        info.balance = result;
      })().catch((e) => {
        log.error('Init User %s failed. %s', info.id, e.stack);
        this.bySeed.delete(seed);
        this.byId.delete(info.id);
      });
      if (!parallelInit) {
        await p;
      }
      promises.push(p);
    }
    await Promise.all(promises);
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
