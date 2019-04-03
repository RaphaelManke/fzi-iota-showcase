import { log } from 'fzi-iota-showcase-client';
import { SafeEmitter, Login } from './events';
import { User, EnvironmentInfo } from './envInfo';
import { Hash } from '@iota/core/typings/types';
import { Users } from './users';

export class Controller {
  constructor(
    public readonly events: SafeEmitter,
    public readonly env: EnvironmentInfo,
    public readonly users: Users,
  ) {}

  public setup() {
    this.events.on('Login', (login: Login) => {
      const user = this.users.getById(login.id);
      this.env.users.push(user!);
    });
    return this;
  }
}
