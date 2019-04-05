export interface RouteStore {
  routesAvailable: any[];
  routeSelectedId: string;
}

export interface RouteInfo {
  start: string;
  destination: string[];
  sections: any[];
}
