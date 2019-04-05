export interface EventStore {
  events: Event[];
}

export interface Event {
  type: string;
  relId: string;
  info: string;
}
