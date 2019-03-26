export interface Vehicle {
  speed: number;

  start(): void;

  stop(): void;

  markerDetected(id: string): void;
}
