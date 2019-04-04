import { RouteStore } from "./types";
import { Module } from "vuex";
import { RootState } from "../types";
export const routes: Module<RouteStore, RootState> = {
  namespaced: true,
  state: {
    routesAvailable: [
      { id: "A", route: ["A", "B", "C"] },
      {
        id: "B",
        route: ["A", "Peter", "C", "Markt", "Brunnenstraße"]
      },
      { id: "C", route: ["A", "B", "C"] },
      { id: "D", route: ["A", "B", "C"] },
      { id: "E", route: ["A", "Peter", "C"] },
      { id: "F", route: ["A", "B", "C"] }
    ],
    routeSelectedId: ""
  },
  mutations: {
    updateRoutesAvailable(state: any, route: any) {
      state.routesAvailable = route;
    },
    updateRouteSelectedId(state: any, selected: string) {
      state.routeSelectedId = selected;
    }
  },
  getters: {
    getRoutesAvailable: (state: any) => {
      return state.routesAvailable;
    },
    getRouteSelectedId: (state: any) => {
      return state.routeSelectedId;
    },
    getRouteById: (state: any) => (id: string) => {
      return state.routesAvailable.find((el: any) => el.id === id);
    }
  }
};
