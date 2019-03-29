import { EventEmitter2 } from "eventemitter2";

export const eventBus = new EventEmitter2({ wildcard: true });
