export interface RouteStore {
  routesAvailable: RouteInfo[];
  routeSelectedId: string;
}

export interface RouteInfo {
  start: string;
  destination: string[];
  sections: any[];
}
