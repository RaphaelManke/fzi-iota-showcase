import { RouteStore } from "./types";
import { Module } from "vuex";
import { RootState } from "../types";
export const routes: Module<RouteStore, RootState> = {
  namespaced: true,
  state: {
    routesAvailable: [],
    routeSelectedIndex: -1,
    routeSelected: undefined
  },
  mutations: {
    updateRoutesAvailable(state: any, route: any) {
      state.routesAvailable = route;
    },
    updateRouteSelected(state: any, selected: string) {
      state.routeSelectedIndex = selected;
      state.routeSelected = JSON.parse(
        JSON.stringify(state.routesAvailable[state.routeSelectedIndex])
      );
      state.routeSelected.sections.forEach((el: any) => {
        el.duration = Math.round(
          (Date.parse(el.arrival) - Date.parse(el.departure)) / 500
        );
        el.passed_count = 0;
      });
    },
    routeFinished(state: any) {
      state.routeSelected = undefined;
      state.routeSelectedIndex = -1;
      state.routesAvailable = [];
    },
    SOCKET_PosUpdated(state: any, data: any) {
      state.routeSelected.sections.find(
        (sec: any) => sec.vehicle.id === data.id
      ).passed_count++;
    }
  },
  getters: {
    getRoutesAvailable: (state: any) => {
      return state.routesAvailable;
    },
    getRouteSelectedIndex: (state: any) => {
      return state.routeSelectedIndex;
    },
    getRouteById: (state: any) => (id: string) => {
      return state.routesAvailable.find((el: any) => el.id === id);
    },
    getRouteSelected(state: any) {
      return state.routeSelected;
    }
  }
};
