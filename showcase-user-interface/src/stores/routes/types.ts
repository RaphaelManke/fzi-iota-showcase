export interface RouteStore {
  routesAvailable: RouteInfo[];
  routeSelectedIndex: number;
  routeSelected: any;
  trip: any;
  nextTrip: any;
  routeState: string;
}

export interface RouteInfo {
  start: string;
  destination: string[];
  sections: any[];
}
