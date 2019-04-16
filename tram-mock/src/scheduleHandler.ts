import { ScheduleDescription } from './scheduleDescription';
import { VehicleMock } from 'fzi-iota-showcase-vehicle-mock';

export class ScheduleHandler {
  constructor(
    private mock: VehicleMock,
    private schedule: ScheduleDescription,
  ) {}

  public startSchedule() {}
}
