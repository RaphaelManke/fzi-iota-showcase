export interface RouteStore {
  routesAvailable: RouteInfo[];
  routeSelectedIndex: number;
}

export interface RouteInfo {
  start: string;
  destination: string[];
  sections: any[];
}
