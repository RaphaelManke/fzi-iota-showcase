export interface RouteStore {
  routesAvailable: RouteInfo[];
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
