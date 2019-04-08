import { RouteStore } from "./types";
import { Module } from "vuex";
import { RootState } from "../types";
export const routes: Module<RouteStore, RootState> = {
  namespaced: true,
  state: {
    routesAvailable: [],
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
    },
    getRouteSelected(state: any) {
      return state.routesAvailable.find(
        (el: any) => el.id === state.routeSelectedId
      );
    }
  }
};
