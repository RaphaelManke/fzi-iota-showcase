export interface EventStore {
  events: Event[];
  max_length: number;
}

export interface Event {
  type: string;
  relId: string;
  info: string;
  time: string;
}
