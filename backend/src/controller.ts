import { log } from 'fzi-iota-showcase-client';
import { SafeEmitter, Login, Logout } from './events';
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

    this.events.on('Logout', (logout: Logout) => {
      const user = this.env.users.find((u) => u.id === logout.id);
      const index = this.env.users.indexOf(user!);
      this.env.users.splice(index, 1);
    });
    return this;
  }
}
