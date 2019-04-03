import { log } from 'fzi-iota-showcase-client';
import { SafeEmitter, Login } from './events';
import { User, EnvironmentInfo } from './envInfo';
import { Hash } from '@iota/core/typings/types';

export class Controller {
  constructor(
    public readonly events: SafeEmitter,
    public readonly env: EnvironmentInfo,
    public readonly users: Map<Hash, User>,
  ) {}

  public setup() {
    this.events.on('Login', (login: Login) => {
      this.env.users.push(login);
    });
    return this;
  }
}
