export interface RouteStore {
  routesAvailable: RouteInfo[];
  routeSelectedIndex: number;
  routeSelected: any;
}

export interface RouteInfo {
  start: string;
  destination: string[];
  sections: any[];
}
