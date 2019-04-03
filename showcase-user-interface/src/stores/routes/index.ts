import { RouteStore } from "./types";
import { Module } from "vuex";
import { RootState } from "../types";
export const routes: Module<RouteStore, RootState> = {
  namespaced: true,
  state: {
    routesAvailable: [
      { id: "A", route: ["A", "B", "C"] },
      { id: "B", route: ["A", "Peter", "C"] },
      { id: "C", route: ["A", "B", "C"] }
    ],
    routeSelectedId: ""
  },
  mutations: {
    updateRoutesAvailable(state: any, route: any) {
      state.routesAvailable = route;
    },
    updateRouteSelected(state: any, selected: string) {
      state.routeSelectedId = selected;
    }
  },
  getters: {
    getRoutesAvailable: (state: any) => {
      return state.routesAvailable;
    },
    getRouteSelected: (state: any) => {
      return state.routeSelectedId;
    }
  }
};
